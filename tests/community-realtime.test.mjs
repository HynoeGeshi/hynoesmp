import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {mergeMessages} from '../assets/global-chat-core.mjs';

const worker=await readFile(new URL('../relay/worker.mjs',import.meta.url),'utf8');

test('worker exposes a WebSocket upgrade path and keeps HTTP message fallback',()=>{
  assert.match(worker,/WebSocketPair/);
  assert.match(worker,/['"]\/live['"]/);
  assert.match(worker,/path==='\/messages'.*GET/s);
});

test('message merging is ordered and duplicate safe',()=>{
  const a={id:'a',createdAt:10,text:'a'},b={id:'b',createdAt:20,text:'b'},b2={id:'b',createdAt:20,text:'changed'},c={id:'c',createdAt:15,text:'c'};
  assert.deepEqual(mergeMessages([a,b],[b2,c]).map(x=>x.id),['a','c','b']);
  assert.equal(mergeMessages([a,b],[b2,c]).find(x=>x.id==='b').text,'changed');
});

test('message merging caps retained client history',()=>{
  const incoming=Array.from({length:140},(_,i)=>({id:String(i),createdAt:i,text:String(i)}));
  const out=mergeMessages([],incoming,100);
  assert.equal(out.length,100);
  assert.equal(out[0].id,'40');
  assert.equal(out.at(-1).id,'139');
});
