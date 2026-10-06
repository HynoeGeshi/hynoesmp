import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker,* as relay from '../relay/worker.mjs';

const {ChatRoom,validateMessage}=relay;
class Storage{
 constructor(){this.map=new Map;this.alarm=null;this.queue=Promise.resolve();}
 async get(k){return structuredClone(this.map.get(k));}
 async put(k,v){this.map.set(k,structuredClone(v));}
 async delete(k){this.map.delete(k);}
 async list(){return this.map;}
 async getAlarm(){return this.alarm;}
 async setAlarm(v){this.alarm=v;}
 transaction(fn){const op=this.queue.then(()=>fn(this));this.queue=op.catch(()=>{});return op;}
}
function setup(){
 const storage=new Storage;
 const env={TURNSTILE_SECRET:'test',IP_SALT:'test',SESSION_SECRET:'session-test-secret',ADMIN_TOKEN:'private-test',CHAT_ENABLED:'true'};
 return {storage,room:new ChatRoom({storage},env),env};
}
function req(path,b,{admin=false,guestToken='',ip='192.0.2.1'}={}){
 const headers={Origin:'https://hynoesmp.com','CF-Connecting-IP':ip};
 if(admin)headers.Authorization='Bearer private-test';
 if(guestToken)headers.Authorization='Guest '+guestToken;
 return new Request('https://relay.test'+path,{method:b?'POST':'GET',headers,body:b?JSON.stringify(b):undefined});
}
async function withTurnstile(fn,{hostname='hynoesmp.com'}={}){
 const old=globalThis.fetch;let calls=0;
 globalThis.fetch=async url=>{calls++;assert.ok(String(url).includes('siteverify'));return Response.json({success:true,hostname});};
 try{return await fn(()=>calls);}finally{globalThis.fetch=old;}
}
async function openSession(room,{ip='192.0.2.1'}={}){
 const response=await room.fetch(req('/session',{token:'turnstile-token',consent:true},{ip}));
 const data=await response.json();
 return {response,data};
}
function actorRecords(storage){return [...storage.map.entries()].filter(([k])=>k.startsWith('actor:'));}

test('moderation normalizes evasion, censors ordinary profanity, and blocks severe abuse',()=>{
 assert.equal(typeof relay.normalizeForModeration,'function');
 assert.equal(typeof relay.moderateMessage,'function');
 assert.match(relay.normalizeForModeration('k ! l l   y 0 u'),/kill you/);
 const ordinary=relay.moderateMessage('this is fucking wild');
 assert.equal(ordinary.action,'censor');
 assert.equal(ordinary.text,'this is f****** wild');
 const severe=relay.moderateMessage('k ! l l y 0 u');
 assert.equal(severe.action,'block');
 assert.equal(typeof severe.reason,'string');
});

test('message validation rejects commands controls and links without trusting a client name',()=>{
 for(const text of ['/op Player','hello\nstop','hello\u00a7a','visit https://evil.example'])assert.throws(()=>validateMessage({text}));
 assert.deepEqual(validateMessage({text:'hello there'}),{text:'hello there'});
});

test('guest session bootstraps once with Turnstile and normal chat uses signed guest auth',async()=>{
 const {room,storage}=setup();
 await withTurnstile(async calls=>{
  const {response,data}=await openSession(room);
  assert.equal(response.status,201);
  assert.equal(typeof data.token,'string');
  assert.match(data.callsign,/^[A-Za-z0-9 -]{2,20}$/);
  assert.ok(data.expiresAt>Date.now());
  assert.equal(calls(),1);
  const actors=actorRecords(storage);
  assert.equal(actors.length,1);
  assert.equal(JSON.stringify(actors[0][1]).includes('192.0.2.1'),false);
  assert.equal(Buffer.from(data.token.split('.')[0],'base64url').toString().includes('192.0.2.1'),false);
  const old=globalThis.fetch;globalThis.fetch=async()=>{throw new Error('normal chat must not re-run Turnstile or call an external delivery');};
  try{
   const send=await room.fetch(req('/messages',{text:'Hello Hynoe!'},{guestToken:data.token}));
   assert.equal(send.status,201);
   const feed=await(await room.fetch(req('/messages'))).json();
   assert.equal(feed.messages.length,1);
   assert.equal(feed.messages[0].displayName,data.callsign);
   assert.equal(feed.messages[0].actorId,undefined);
  }finally{globalThis.fetch=old;}
 });
});

test('tampered malformed and expired guest sessions fail closed with one generic error',async()=>{
 const {room,storage}=setup();
 await withTurnstile(async()=>{
  const {data}=await openSession(room);
  const tampered=data.token.slice(0,-1)+(data.token.endsWith('a')?'b':'a');
  for(const token of ['not-a-token',tampered]){
   const r=await room.fetch(req('/messages',{text:'hello'},{guestToken:token}));
   assert.equal(r.status,401);
   assert.equal((await r.json()).error,'Guest session is invalid or expired.');
  }
  const [[key,actor]]=actorRecords(storage);actor.expires=1;await storage.put(key,actor);
  const expired=await room.fetch(req('/messages',{text:'hello'},{guestToken:data.token}));
  assert.equal(expired.status,401);
  assert.equal((await expired.json()).error,'Guest session is invalid or expired.');
 });
});

test('callsign rename rejects staff names, persists, and keeps the same actor identity',async()=>{
 const {room,storage}=setup();
 await withTurnstile(async()=>{
  const {data}=await openSession(room);
  assert.equal((await room.fetch(req('/session/name',{name:'Admin'},{guestToken:data.token}))).status,400);
  const actorsBefore=actorRecords(storage);assert.equal(actorsBefore.length,1);const actorId=actorsBefore[0][1].actorId;
  const renamed=await room.fetch(req('/session/name',{name:'CopperWolf-27'},{guestToken:data.token}));
  assert.equal(renamed.status,200);assert.equal((await renamed.json()).callsign,'CopperWolf-27');
  const actorsAfter=actorRecords(storage);assert.equal(actorsAfter[0][1].actorId,actorId);assert.equal(actorsAfter[0][1].callsign,'CopperWolf-27');
  const sent=await room.fetch(req('/messages',{text:'renamed and still me'},{guestToken:data.token}));assert.equal(sent.status,201);
  const feed=await(await room.fetch(req('/messages'))).json();assert.equal(feed.messages[0].displayName,'CopperWolf-27');
 });
});

test('mute follows actor identity even after the guest changes callsign',async()=>{
 const {room,storage}=setup();
 await withTurnstile(async()=>{
  const {data}=await openSession(room);
  await room.fetch(req('/session/name',{name:'FirstName'},{guestToken:data.token}));
  const sent=await room.fetch(req('/messages',{text:'message before mute'},{guestToken:data.token}));
  assert.equal(sent.status,201);const record=await sent.json();
  assert.equal((await room.fetch(req('/admin/mute',{id:record.message.id},{admin:true}))).status,200);
  const actor=actorRecords(storage)[0][1];assert.ok((await storage.get('mute:'+actor.actorId)).expires>Date.now());
  assert.equal((await room.fetch(req('/session/name',{name:'SecondName'},{guestToken:data.token}))).status,200);
  const blocked=await room.fetch(req('/messages',{text:'still muted'},{guestToken:data.token}));
  assert.equal(blocked.status,403);
 });
});

test('concurrent sends from one guest publish once and public records hide private metadata',async()=>{
 const {room}=setup();
 await withTurnstile(async()=>{
  const {data}=await openSession(room);
  const responses=await Promise.all([
   room.fetch(req('/messages',{text:'one'},{guestToken:data.token})),
   room.fetch(req('/messages',{text:'two'},{guestToken:data.token}))
  ]);
  assert.deepEqual(responses.map(r=>r.status).sort(),[201,429]);
  const feed=await(await room.fetch(req('/messages'))).json();assert.equal(feed.messages.length,1);
  for(const key of ['actorId','ipHash','moderation'])assert.equal(feed.messages[0][key],undefined);
 });
});

test('source and worker config contain no Bloom or Minecraft chat dependency',async()=>{
 const [source,config]=await Promise.all([readFile(new URL('../relay/worker.mjs',import.meta.url),'utf8'),readFile(new URL('../relay/wrangler.toml',import.meta.url),'utf8')]);
 for(const needle of ['BLOOM_API_KEY','BLOOM_SERVER_ID','tellraw','mc.bloom.host']){assert.equal(source.includes(needle),false,`worker still contains ${needle}`);assert.equal(config.includes(needle),false,`config still contains ${needle}`);}
});

test('untrusted origins and unauthed moderation are rejected',async()=>{
 assert.equal((await worker.fetch(new Request('https://relay.test/messages',{headers:{Origin:'https://evil.test'}}),{})).status,403);
 const {room}=setup();assert.equal((await room.fetch(req('/admin'))).status,401);
});

test('wrong Turnstile hostname is rejected during session bootstrap',async()=>{
 const {room,storage}=setup();
 await withTurnstile(async()=>{
  const response=await room.fetch(req('/session',{token:'bad-host',consent:true}));
  assert.equal(response.status,403);assert.equal(actorRecords(storage).length,0);
 },{hostname:'evil.test'});
});

test('pause delete report and expiry cleanup remain enforced with guest identity',async()=>{
 const {room,storage}=setup();
 await withTurnstile(async()=>{
  const one=(await openSession(room,{ip:'192.0.2.1'})).data;
  const two=(await openSession(room,{ip:'192.0.2.2'})).data;
  const sent=await room.fetch(req('/messages',{text:'report me'},{guestToken:one.token,ip:'192.0.2.1'}));assert.equal(sent.status,201);const id=(await sent.json()).message.id;
  const report=await room.fetch(req('/report',{id},{guestToken:two.token,ip:'192.0.2.2'}));assert.equal(report.status,200);assert.equal((await storage.get('reports')).length,1);
  assert.equal((await room.fetch(req('/admin/pause',{paused:true},{admin:true}))).status,200);assert.equal((await(await room.fetch(req('/messages'))).json()).enabled,false);
  assert.equal((await room.fetch(req('/admin/delete',{id},{admin:true}))).status,200);assert.equal((await storage.get('messages')).length,0);
  await storage.put('messages',[{createdAt:1,at:1}]);await storage.put('ip:old',{expires:1});await storage.put('actor:old',{expires:1});await room.alarm();
  assert.equal((await storage.get('messages')).length,0);assert.equal(await storage.get('ip:old'),undefined);assert.equal(await storage.get('actor:old'),undefined);
 });
});
