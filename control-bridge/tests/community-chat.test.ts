import { describe, it, expect, vi } from 'vitest';
import { createCommunityHandler, minecraftCommand, publicMessages } from '../src/community/chat';

const origin = 'https://hynoesmp.com';
const requestId = 'eb4d699b-5500-4bab-a5f2-7a68ba193fb7';
function setup() {
  const deps = {
    enabled: true,
    readFeed: vi.fn(async () => []),
    verifyUser: vi.fn(async () => 'verified-user'),
    reserveSlot: vi.fn(async () => 'VerifiedName'),
    postDiscord: vi.fn(async () => ({ id: 'discord-id' })),
    sendMinecraft: vi.fn(async () => undefined),
  };
  return { deps, handler: createCommunityHandler(deps) };
}
function post(body: unknown = { body: 'Hello server!', request_id: requestId }) {
  return new Request('https://bridge.example/api/community/minecraft', { method: 'POST', headers: { origin, authorization: 'Bearer user-jwt' }, body: JSON.stringify(body) });
}
describe('public Minecraft bridge', () => {
  it('requires a signed-in site profile and sends verified name once to both destinations', async () => {
    const {deps,handler}=setup(); const response=await handler(post({body:'Hello server!',request_id:requestId,name:'Admin'}));
    expect(response.status).toBe(201);
    expect(deps.reserveSlot).toHaveBeenCalledWith('user-jwt', requestId);
    expect(deps.postDiscord).toHaveBeenCalledWith('[WEB] VerifiedName: Hello server!', requestId, 'verified-user');
    expect(deps.sendMinecraft).toHaveBeenCalledWith(minecraftCommand('VerifiedName','Hello server!'));
  });
  it('rejects untrusted origins, commands, blocked content and missing auth before provider writes', async () => {
    const {deps,handler}=setup();
    expect((await handler(new Request(post(), {headers:{origin:'https://evil.example'}}))).status).toBe(403);
    expect((await handler(post({body:'/op me',request_id:requestId}))).status).toBe(400);
    expect((await handler(post({body:'kill yourself',request_id:requestId}))).status).toBe(400);
    expect((await handler(new Request(post(), {headers:{origin}}))).status).toBe(401);
    expect(deps.postDiscord).not.toHaveBeenCalled();
  });
  it('censors profanity before delivering website messages to Discord and Minecraft', async () => {
    const {deps,handler}=setup(); const response=await handler(post({body:'This fucking update is shit.',request_id:requestId}));
    expect(response.status).toBe(201);
    expect(deps.postDiscord).toHaveBeenCalledWith('[WEB] VerifiedName: This ******* update is ****.', requestId, 'verified-user');
    expect(deps.sendMinecraft).toHaveBeenCalledWith(minecraftCommand('VerifiedName','This ******* update is ****.'));
  });
  it('blocks explicit solicitation and targeted threats before provider writes', async () => {
    const {deps,handler}=setup();
    for (const body of ['send me nudes','I will kill you','go k.y.s.','ive got multiple bombs','I will plant a bomb']) {
      expect((await handler(post({body,request_id:requestId}))).status).toBe(400);
    }
    expect(deps.postDiscord).not.toHaveBeenCalled();
    expect(deps.sendMinecraft).not.toHaveBeenCalled();
  });
  it('honors muted users and atomic cooldown failures', async () => {
    const {deps,handler}=setup(); deps.reserveSlot.mockRejectedValue(new Error('Posting unavailable or cooldown active.'));
    expect((await handler(post())).status).toBe(429); expect(deps.postDiscord).not.toHaveBeenCalled();
  });
  it('rejects unsafe profile names even when directly inserted through the site database API', async () => {
    const {deps,handler}=setup();
    for (const name of ['name\nspoof', 'Guest: Admin', 'kill yourself', 'Admin']) {
      deps.reserveSlot.mockResolvedValue(name);
      expect((await handler(post())).status).toBe(400);
    }
    expect(deps.postDiscord).not.toHaveBeenCalled();
  });
  it('does not send to Minecraft when Discord delivery is uncertain, and never retries', async () => {
    const {deps,handler}=setup(); deps.postDiscord.mockRejectedValue(new Error('timeout'));
    expect((await handler(post())).status).toBe(502); expect(deps.postDiscord).toHaveBeenCalledTimes(1); expect(deps.sendMinecraft).not.toHaveBeenCalled();
  });
  it('reports partial delivery without telling the visitor to resend', async () => {
    const {deps,handler}=setup(); deps.sendMinecraft.mockRejectedValue(new Error('offline'));
    const response=await handler(post()); expect(response.status).toBe(207);
    expect(await response.json()).toMatchObject({discord:true,minecraft:false});
    expect(deps.postDiscord).toHaveBeenCalledTimes(1);
  });
  it('uses plain JSON tellraw without granting command access', () => {
    const cmd=minecraftCommand('Guest','quote " @everyone');
    expect(cmd.startsWith('tellraw @a ')).toBe(true);
    expect(JSON.parse(cmd.slice(11))[2].text).toBe('quote " @everyone');
  });
  it('uses one Discord feed with source labels and never echoes it back into either provider', () => {
    const messages=publicMessages([
      {id:'3',author:{id:'other',username:'hidden bot',bot:true},content:'bot noise',timestamp:'2026-10-07T03:00:00Z'},
      {id:'2',author:{id:'mc',username:'Player',bot:true},webhook_id:'mc',content:'hello',timestamp:'2026-10-07T02:00:00Z'},
      {id:'1',author:{id:'user',username:'DiscordUser'},content:'hi',timestamp:'2026-10-07T01:00:00Z'},
    ], 'bridge-bot');
    expect(messages.map(m=>m.source)).toEqual(['Discord','Minecraft']);
    expect(messages.map(m=>m.id)).toEqual(['1','2']);
  });
  it('censors ordinary profanity and suppresses blocked incoming Discord or Minecraft content', () => {
    const messages=publicMessages([
      {id:'4',author:{id:'user',username:'Player'},content:'This shit is wild.',timestamp:'2026-10-07T04:00:00Z'},
      {id:'3',author:{id:'other',username:'Player'},content:'I will kill you.',timestamp:'2026-10-07T03:00:00Z'},
      {id:'5',author:{id:'other2',username:'Player'},content:'ive got multiple bombs',timestamp:'2026-10-07T02:30:00Z'},
      {id:'2',author:{id:'mc',username:'Player',bot:true},webhook_id:'mc',content:'you n1gg3r',timestamp:'2026-10-07T02:00:00Z'},
      {id:'1',author:{id:'user2',username:'Player'},content:'class assignment; sex education matters',timestamp:'2026-10-07T01:00:00Z'},
    ], 'bridge-bot');
    expect(messages.map(m=>m.id)).toEqual(['1','4']);
    expect(messages[0].body).toBe('class assignment; sex education matters');
    expect(messages[1].body).toBe('This **** is wild.');
  });
});
