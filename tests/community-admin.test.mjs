import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ChatRoom} from '../relay/worker.mjs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
class Storage{constructor(){this.map=new Map;this.alarm=null;this.queue=Promise.resolve();}async get(k){return structuredClone(this.map.get(k));}async put(k,v){this.map.set(k,structuredClone(v));}async delete(k){this.map.delete(k);}async list(){return this.map;}async getAlarm(){return this.alarm;}async setAlarm(v){this.alarm=v;}transaction(fn){const op=this.queue.then(()=>fn(this));this.queue=op.catch(()=>{});return op;}}
const adminReq=(path,body)=>new Request('https://community.test'+path,{method:body?'POST':'GET',headers:{Origin:'https://hynoesmp.com',Authorization:'Bearer admin-secret'},body:body?JSON.stringify(body):undefined});

test('moderation console is Hynoe Global Chat only and exposes required controls',()=>{
 const html=read('chat-admin.html'),js=read('assets/chat-admin.mjs');
 assert.match(html,/Hynoe Moderation Console/i);assert.match(html,/Global Chat/i);assert.match(html,/id="announcement-form"/);assert.match(html,/id="announcement"/);
 assert.doesNotMatch(html,/Minecraft|Bloom|Campfire|Relay URL/i);assert.doesNotMatch(js,/Minecraft|Bloom|Campfire/i);
 for(const path of ['/admin/pause','/admin/delete','/admin/mute','/admin/announce'])assert.ok(js.includes(path));
 assert.match(js,/report/i);assert.match(js,/textContent/);assert.doesNotMatch(js,/innerHTML\s*=/);
});

test('admin announcement publishes a spoof-proof system message and broadcasts it',async()=>{
 const storage=new Storage,room=new ChatRoom({storage},{ADMIN_TOKEN:'admin-secret'}),events=[];room.broadcast=event=>events.push(event);
 const response=await room.fetch(adminReq('/admin/announce',{text:'Maintenance starts in 10 minutes.'}));assert.equal(response.status,201);const data=await response.json();
 assert.equal(data.message.displayKind,'system');assert.equal(data.message.displayName,'HYNOE SYSTEM');assert.equal(data.message.text,'Maintenance starts in 10 minutes.');assert.equal(data.message.actorId,undefined);
 const messages=await storage.get('messages');assert.equal(messages.length,1);assert.equal(messages[0].displayKind,'system');assert.equal(events[0].type,'message');
});

test('admin announcement validates length, control codes and links before publication',async()=>{
 const storage=new Storage,room=new ChatRoom({storage},{ADMIN_TOKEN:'admin-secret'});
 for(const text of ['', 'x'.repeat(241), 'hello\nworld', 'visit https://evil.example']){
  const response=await room.fetch(adminReq('/admin/announce',{text}));assert.equal(response.status,400);
 }
 assert.equal((await storage.get('messages')||[]).length,0);
});
