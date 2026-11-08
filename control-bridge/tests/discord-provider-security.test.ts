import { afterEach, expect, it, vi } from 'vitest';
import { createDiscordClient } from '../src/discord/client';
import type { AppConfig } from '../src/config';
const config = { discordGuildId: 'guild', discordBotToken: 'BOT_SECRET' } as AppConfig;
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it.each([
  ['lost response', () => Promise.reject(new Error('private BOT_SECRET')), 'unknown', /may have applied.*verify.*retry/i],
  ['gateway error', () => Promise.resolve(Response.json({ message: 'private BOT_SECRET' }, { status: 502 })), 'unknown', /may have applied.*verify.*retry/i],
  ['invalid success body', () => Promise.resolve(new Response('private BOT_SECRET', { status: 200 })), 'applied', /accepted.*verify.*retry/i],
  ['unreadable success body', () => Promise.resolve(new Response(new ReadableStream({ start(controller) { controller.error(new Error('private BOT_SECRET')); } }), { status: 200 })), 'applied', /accepted.*verify.*retry/i],
] as const)('records the outcome without retrying: %s', async (_label, respond, outcome, message) => {
  const audit = vi.spyOn(console, 'info').mockImplementation(() => {});
  const fetchMock = vi.fn(respond);
  vi.stubGlobal('fetch', fetchMock);
  const write = createDiscordClient({ ...config, auditLogEnabled: true }).updateChannel('c1', { name: 'new' });
  await expect(write).rejects.toThrow(message);
  await expect(write).rejects.not.toThrow(/private|BOT_SECRET/);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(audit).toHaveBeenCalledTimes(1);
  const log = audit.mock.calls[0][0] as string;
  expect(JSON.parse(log)).toMatchObject({ tool: 'discord_provider_write', target: '/channels/c1', detail: { method: 'PATCH', outcome } });
  expect(log).not.toMatch(/private|BOT_SECRET/);
});
it('never returns webhook tokens or URLs from inventory', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json([{ id: 'w1', name: 'Minecraft', token: 'WEBHOOK_SECRET', url: 'https://discord.com/api/webhooks/w1/WEBHOOK_SECRET' }])));
  const output = await createDiscordClient(config).listGuildWebhooks();
  expect(output[0].name).toBe('Minecraft');
  expect(JSON.stringify(output)).not.toContain('SECRET');
});
it('does not echo provider response bodies on write failure or retry writes', async () => {
  const fetchMock = vi.fn(async () => Response.json({ code: 50013, message: 'private user text BOT_SECRET' }, { status: 403 }));
  vi.stubGlobal('fetch', fetchMock);
  await expect(createDiscordClient(config).updateChannel('c1', { name: 'new' })).rejects.toThrow('code 50013');
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await expect(createDiscordClient(config).updateChannel('c1', { name: 'new' })).rejects.not.toThrow(/BOT_SECRET|private user text/);
});
it('sends and edits embeds without parsing role or member mentions', async () => {
  const fetchMock = vi.fn(async () => Response.json({ id: 'm1', author: { id: 'bot' } })); vi.stubGlobal('fetch', fetchMock);
  const client = createDiscordClient(config);
  await client.sendMessagePayload('c1', { embeds: [{ title: 'Gold Hynoe' }], allowed_mentions: { parse: [] } });
  await client.editMessage('c1', 'm1', { content: 'updated', allowed_mentions: { parse: [] } });
  expect(fetchMock.mock.calls.map((call: any) => [call[0], call[1].method])).toEqual([['https://discord.com/api/v10/channels/c1/messages', 'POST'], ['https://discord.com/api/v10/channels/c1/messages/m1', 'PATCH']]);
});
