import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ChatRoom} from '../relay/worker.mjs';

class Storage{constructor(){this.map=new Map;this.alarm=null;this.queue=Promise.resolve();}async get(k){return structuredClone(this.map.get(k));}async put(k,v){this.map.set(k,structuredClone(v));}async delete(k){this.map.delete(k);}async list(){return this.map;}async getAlarm(){return this.alarm;}async setAlarm(v){this.alarm=v;}transaction(fn){const op=this.queue.then(()=>fn(this));this.queue=op.catch(()=>{});return op;}}
const env={TURNSTILE_SECRET:'t',IP_SALT:'i',ADMIN_TOKEN:'admin-secret',SESSION_SECRET:'s',CHAT_ENABLED:'true'};
const req=(path,body)=>new Request('https://community.test'+path,{method:body?'POST':'GET',headers:{Origin:'https://hynoesmp.com',Authorization:'Bearer admin-secret'},body:body?JSON.stringify(body):undefined});
const setup=()=>{const storage=new Storage;return {storage,room:new ChatRoom({storage},env)};};

test('admin can post a distinct system announcement and it appears publicly',async()=>{
 const {room}=setup();const r=await room.fetch(req('/admin/announce',{text:'Maintenance starts in 10 minutes.'}));assert.equal(r.status,201);
 const feed=await(await room.fetch(new Request('https://community.test/messages',{headers:{Origin:'https://hynoesmp.com'}}))).json();
 assert.equal(feed.messages.length,1);assert.equal(feed.messages[0].displayKind,'system');assert.equal(feed.messages[0].displayName,'HYNOE SYSTEM');assert.equal(feed.messages[0].text,'Maintenance starts in 10 minutes.');
});

test('admin announcement rejects links commands control chars and oversized text',async()=>{
 const {room}=setup();for(const text of ['/op x','https://evil.test','hi\nthere','x'.repeat(241)])assert.equal((await room.fetch(req('/admin/announce',{text}))).status,400);
});

test('admin GET exposes pseudonymous actor mute state but never visitor hash',async()=>{
 const {room,storage}=setup(),now=Date.now();await storage.put('messages',[{id:'m',actorId:'actor-1',displayName:'CopperWolf',displayKind:'guest',text:'hi',createdAt:now,ipHash:'private'}]);await storage.put('mute-actor:actor-1',{expires:now+60000});
 const data=await(await room.fetch(req('/admin'))).json();assert.equal(data.messages[0].actorId,'actor-1');assert.equal(data.messages[0].muted,true);assert.equal(data.messages[0].ipHash,undefined);
});

test('admin can unmute a guest actor without deleting messages',async()=>{
 const {room,storage}=setup(),now=Date.now();await storage.put('messages',[{id:'m',actorId:'actor-1',displayName:'CopperWolf',displayKind:'guest',text:'hi',createdAt:now,ipHash:'private'}]);await storage.put('mute-actor:actor-1',{expires:now+60000});
 assert.equal((await room.fetch(req('/admin/unmute',{actorId:'actor-1'}))).status,200);assert.equal(await storage.get('mute-actor:actor-1'),undefined);assert.equal((await storage.get('messages')).length,1);
});

test('moderation console has no Minecraft or campfire relay language and uses new controls',()=>{
 const html=readFileSync(new URL('../chat-admin.html',import.meta.url),'utf8');const js=readFileSync(new URL('../assets/chat-admin.mjs',import.meta.url),'utf8');
 assert.match(html,/Hynoe Moderation Console/i);assert.doesNotMatch(html,/Minecraft|Campfire|Relay URL|broadcast/i);assert.match(html,/id="announcement"/);assert.match(js,/displayName/);assert.match(js,/admin\/announce/);assert.match(js,/admin\/unmute/);assert.doesNotMatch(js,/m\.name\b/);
});
