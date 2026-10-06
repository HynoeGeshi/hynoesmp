import test from 'node:test';
import assert from 'node:assert/strict';
import {ChatRoom} from '../relay/worker.mjs';

class Storage{constructor(){this.map=new Map;this.alarm=null;this.queue=Promise.resolve();}async get(k){return structuredClone(this.map.get(k));}async put(k,v){this.map.set(k,structuredClone(v));}async delete(k){this.map.delete(k);}async list(){return this.map;}async getAlarm(){return this.alarm;}async setAlarm(v){this.alarm=v;}transaction(fn){const op=this.queue.then(()=>fn(this));this.queue=op.catch(()=>{});return op;}}
const req=(body,ip='192.0.2.44')=>new Request('https://community.test/help/external',{method:'POST',headers:{Origin:'https://hynoesmp.com','CF-Connecting-IP':ip,'Content-Type':'application/json'},body:JSON.stringify(body)});
const setup=env=>new ChatRoom({storage:new Storage},{IP_SALT:'salt',...env});

test('external help is explicitly unavailable when no private provider is configured',async()=>{
 const room=setup({});
 const old=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('should not call');};
 try{const r=await room.fetch(req({question:'How do I craft a vanilla piston?',context:{page:'start.html'}}));assert.equal(r.status,200);assert.deepEqual(await r.json(),{status:'unavailable'});assert.equal(calls,0);}finally{globalThis.fetch=old;}
});

test('configured external help sends only bounded question and safe context and normalizes response',async()=>{
 const room=setup({HELP_PROVIDER_URL:'https://help-provider.example/answer',HELP_PROVIDER_KEY:'private-key'});
 const old=globalThis.fetch;let seen;
 globalThis.fetch=async(url,options)=>{seen={url:String(url),options};return Response.json({answer:'A piston uses planks, cobblestone, iron, and redstone.',sources:[{title:'Minecraft Wiki',url:'https://minecraft.wiki/w/Piston'},{title:'Bad',url:'javascript:alert(1)'}]});};
 try{
  const question='How do I craft a piston?';const context={page:'start.html',sectionId:'first-day',outpostRoom:'mine',secret:'drop-me'};
  const r=await room.fetch(req({question,context}));assert.equal(r.status,200);const data=await r.json();assert.equal(data.status,'external');assert.match(data.answer,/piston/i);assert.deepEqual(data.sources,[{title:'Minecraft Wiki',url:'https://minecraft.wiki/w/Piston'}]);
  assert.equal(seen.url,'https://help-provider.example/answer');assert.equal(seen.options.headers.Authorization,'Bearer private-key');const sent=JSON.parse(seen.options.body);assert.deepEqual(sent,{question,context:{page:'start.html',sectionId:'first-day',outpostRoom:'mine'}});
 }finally{globalThis.fetch=old;}
});

test('external help rejects oversized questions and fails closed on provider errors',async()=>{
 const room=setup({HELP_PROVIDER_URL:'https://help-provider.example/answer',HELP_PROVIDER_KEY:'private-key'});
 assert.equal((await room.fetch(req({question:'x'.repeat(501),context:{}}))).status,400);
 const old=globalThis.fetch;globalThis.fetch=async()=>{throw Error('provider down');};
 try{const r=await room.fetch(req({question:'What is redstone?',context:{page:'start.html'}}));assert.equal(r.status,200);assert.deepEqual(await r.json(),{status:'unavailable'});}finally{globalThis.fetch=old;}
});

test('external help rate limit is server-side and independent from public chat identity',async()=>{
 const room=setup({HELP_PROVIDER_URL:'https://help-provider.example/answer',HELP_PROVIDER_KEY:'private-key'});const old=globalThis.fetch;globalThis.fetch=async()=>Response.json({answer:'ok',sources:[]});
 try{let last;for(let i=0;i<13;i++)last=await room.fetch(req({question:'question '+i,context:{page:'index.html'}}));assert.equal(last.status,429);}finally{globalThis.fetch=old;}
});
