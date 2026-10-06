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
 const env={TURNSTILE_SECRET:'test',IP_SALT:'test',SESSION_SECRET:'session-test',ADMIN_TOKEN:'private-test',CHAT_ENABLED:'true'};
 return {storage,room:new ChatRoom({storage},env),env};
}
const req=(path,b,admin=false)=>new Request('https://relay.test'+path,{method:b?'POST':'GET',headers:{Origin:'https://hynoesmp.com','CF-Connecting-IP':'192.0.2.1',...(admin?{Authorization:'Bearer private-test'}:{})},body:b?JSON.stringify(b):undefined});
const msg={name:'Viewer',text:'Hello Hynoe!',consent:true,token:'test-token'};

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

test('commands, controls, links, and reserved staff names are rejected',()=>{
 for(const text of ['/op Player','hello\nstop','hello\u00a7a','visit https://evil.example'])assert.throws(()=>validateMessage({...msg,text}));
 for(const name of ['Admin','Hynoe','system'])assert.throws(()=>validateMessage({...msg,name}));
 assert.doesNotThrow(()=>validateMessage({...msg,name:'CopperWolf-27',text:'hello there'}));
});

test('site-native accepted messages persist without external delivery and hide private metadata',async()=>{
 const {room}=setup();
 const old=globalThis.fetch;
 let externalCalls=0;
 globalThis.fetch=async url=>{
  if(String(url).includes('siteverify'))return Response.json({success:true,hostname:'hynoesmp.com'});
  externalCalls++;
  throw new Error('unexpected external delivery');
 };
 try{
  const responses=await Promise.all([room.fetch(req('/messages',msg)),room.fetch(req('/messages',msg))]);
  assert.deepEqual(responses.map(r=>r.status).sort(),[201,429]);
  assert.equal(externalCalls,0);
  const data=await(await room.fetch(req('/messages'))).json();
  assert.equal(data.messages.length,1);
  assert.equal(data.messages[0].ipHash,undefined);
  assert.equal(data.messages[0].text,'Hello Hynoe!');
 }finally{globalThis.fetch=old;}
});

test('source and worker config contain no Bloom or Minecraft chat dependency',async()=>{
 const [source,config]=await Promise.all([
  readFile(new URL('../relay/worker.mjs',import.meta.url),'utf8'),
  readFile(new URL('../relay/wrangler.toml',import.meta.url),'utf8')
 ]);
 for(const needle of ['BLOOM_API_KEY','BLOOM_SERVER_ID','tellraw','mc.bloom.host']){
  assert.equal(source.includes(needle),false,`worker still contains ${needle}`);
  assert.equal(config.includes(needle),false,`config still contains ${needle}`);
 }
});

test('untrusted origins and unauthed moderation are rejected',async()=>{
 assert.equal((await worker.fetch(new Request('https://relay.test/messages',{headers:{Origin:'https://evil.test'}}),{})).status,403);
 const {room}=setup();
 assert.equal((await room.fetch(req('/admin'))).status,401);
});

test('wrong Turnstile hostname is rejected before message storage',async()=>{
 const {room,storage}=setup();
 let calls=0;
 const old=globalThis.fetch;
 globalThis.fetch=async()=>{calls++;return Response.json({success:true,hostname:'evil.test'});};
 try{
  assert.equal((await room.fetch(req('/messages',msg))).status,403);
  assert.equal(calls,1);
  assert.equal((await storage.get('messages')||[]).length,0);
 }finally{globalThis.fetch=old;}
});

test('pause and delete work and expiry alarm removes old messages',async()=>{
 const {room,storage}=setup();
 await storage.put('messages',[{id:'m',name:'Viewer',text:'hi',ipHash:'private',at:Date.now()}]);
 assert.equal((await room.fetch(req('/admin/pause',{paused:true},true))).status,200);
 assert.equal((await(await room.fetch(req('/messages'))).json()).enabled,false);
 assert.equal((await room.fetch(req('/messages',msg))).status,429);
 await room.fetch(req('/admin/delete',{id:'m'},true));
 assert.equal((await storage.get('messages')).length,0);
 await storage.put('messages',[{at:1}]);
 await storage.put('ip:old',{expires:1});
 await room.alarm();
 assert.equal((await storage.get('messages')).length,0);
 assert.equal(await storage.get('ip:old'),undefined);
});

test('reports are recorded and mute removes guest history',async()=>{
 const {room,storage}=setup();
 const old=globalThis.fetch;
 globalThis.fetch=async()=>Response.json({success:true,hostname:'hynoesmp.com'});
 try{
  await storage.put('messages',[{id:'bad',at:Date.now(),ipHash:'guest-hash',name:'Guest',text:'abuse'}]);
  assert.equal((await room.fetch(req('/report',{id:'bad',token:'test'}))).status,200);
  assert.equal((await storage.get('reports')).length,1);
  assert.equal((await room.fetch(req('/admin/mute',{id:'bad'},true))).status,200);
  assert.ok((await storage.get('mute:guest-hash')).expires>Date.now());
  assert.equal((await storage.get('messages')).length,0);
  assert.equal((await storage.get('reports')).length,0);
 }finally{globalThis.fetch=old;}
});
