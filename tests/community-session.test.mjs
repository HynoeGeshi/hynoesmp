import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ChatRoom,signGuestSession,verifyGuestSession,generateCallsign} from '../relay/worker.mjs';

class Storage{constructor(){this.map=new Map;this.alarm=null;this.queue=Promise.resolve();}async get(k){return structuredClone(this.map.get(k));}async put(k,v){this.map.set(k,structuredClone(v));}async delete(k){this.map.delete(k);}async list(){return this.map;}async getAlarm(){return this.alarm;}async setAlarm(v){this.alarm=v;}transaction(fn){const op=this.queue.then(()=>fn(this));this.queue=op.catch(()=>{});return op;}}
const env={TURNSTILE_SECRET:'test',IP_SALT:'salt',ADMIN_TOKEN:'admin',SESSION_SECRET:'session-secret',CHAT_ENABLED:'true'};
const request=(path,body,auth,ip='192.0.2.4')=>new Request('https://community.test'+path,{method:body?'POST':'GET',headers:{Origin:'https://hynoesmp.com','CF-Connecting-IP':ip,...(auth?{Authorization:auth}:{})},body:body?JSON.stringify(body):undefined});
const setup=()=>{const storage=new Storage;return {storage,room:new ChatRoom({storage},env)};};

test('guest token signs, verifies, expires, and rejects tampering',async()=>{
  assert.equal(typeof signGuestSession,'function');
  assert.equal(typeof verifyGuestSession,'function');
  const now=1_800_000_000_000;
  const token=await signGuestSession({actorId:'actor-1',issuedAt:now,expiresAt:now+60_000},env.SESSION_SECRET);
  assert.equal((await verifyGuestSession(token,env.SESSION_SECRET,now+1000)).actorId,'actor-1');
  assert.equal(await verifyGuestSession(token+'x',env.SESSION_SECRET,now+1000),null);
  assert.equal(await verifyGuestSession(token,env.SESSION_SECRET,now+61_000),null);
});

test('generated callsigns are valid and never staff-like',()=>{
  for(let i=0;i<40;i++){
    const name=generateCallsign();
    assert.match(name,/^[A-Za-z0-9_-]{2,20}$/);
    assert.doesNotMatch(name,/admin|mod|owner|hynoe|system|staff/i);
  }
});

test('session bootstrap verifies Turnstile once then message uses Guest auth',async()=>{
  const {room}=setup();let verifies=0;
  const old=globalThis.fetch;globalThis.fetch=async url=>{assert.match(String(url),/siteverify/);verifies++;return Response.json({success:true,hostname:'hynoesmp.com'});};
  try{
    const sr=await room.fetch(request('/session',{token:'turnstile'}));
    assert.equal(sr.status,201);const session=await sr.json();
    assert.match(session.token,/\./);assert.ok(session.callsign);assert.ok(session.expiresAt>Date.now());
    const mr=await room.fetch(request('/messages',{text:'hello everyone',consent:true},'Guest '+session.token));
    assert.equal(mr.status,201);assert.equal(verifies,1);
    const feed=await (await room.fetch(request('/messages'))).json();
    assert.equal(feed.messages[0].displayName,session.callsign);
  }finally{globalThis.fetch=old;}
});

test('rename keeps actor identity and reserved names are rejected',async()=>{
  const {room,storage}=setup();const old=globalThis.fetch;globalThis.fetch=async()=>Response.json({success:true,hostname:'hynoesmp.com'});
  try{
    const session=await (await room.fetch(request('/session',{token:'turnstile'}))).json();
    const actorBefore=[...(await storage.list()).entries()].find(([k])=>k.startsWith('actor:'))?.[1];
    assert.ok(actorBefore?.id);
    assert.equal((await room.fetch(request('/session/name',{name:'HynoeAdmin'},'Guest '+session.token))).status,400);
    assert.equal((await room.fetch(request('/session/name',{name:'CopperWolf'},'Guest '+session.token))).status,200);
    const actorAfter=await storage.get('actor:'+actorBefore.id);
    assert.equal(actorAfter.id,actorBefore.id);assert.equal(actorAfter.callsign,'CopperWolf');
  }finally{globalThis.fetch=old;}
});

test('mute follows actor across rename',async()=>{
  const {room,storage}=setup();const old=globalThis.fetch;globalThis.fetch=async()=>Response.json({success:true,hostname:'hynoesmp.com'});
  try{
    const session=await (await room.fetch(request('/session',{token:'turnstile'}))).json();
    const actor=[...(await storage.list()).entries()].find(([k])=>k.startsWith('actor:'))?.[1];
    await storage.put('mute-actor:'+actor.id,{expires:Date.now()+60_000});
    assert.equal((await room.fetch(request('/session/name',{name:'NewName'},'Guest '+session.token))).status,200);
    const send=await room.fetch(request('/messages',{text:'should not post',consent:true},'Guest '+session.token));
    assert.equal(send.status,429);
  }finally{globalThis.fetch=old;}
});
