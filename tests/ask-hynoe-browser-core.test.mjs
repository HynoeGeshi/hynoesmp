import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  validateBrowserQuestion,
  appendPrivateHistory,
  normalizeHelpResult,
  askHynoe,
} from '../assets/ask-hynoe.mjs';

test('browser question validation matches server bound and rejects blank/control-only input',()=>{
  assert.equal(validateBrowserQuestion('').ok,false);
  assert.equal(validateBrowserQuestion('x'.repeat(601)).ok,false);
  assert.equal(validateBrowserQuestion('\u0000\u0001').ok,false);
  assert.deepEqual(validateBrowserQuestion('  How do I join?  '),{ok:true,value:'How do I join?'});
});

test('private history is memory-only shaped and capped to six turns',()=>{
  let history=[];
  for(let i=0;i<8;i++) history=appendPrivateHistory(history,{role:i%2?'assistant':'user',content:`turn ${i}`});
  assert.equal(history.length,6);
  assert.equal(history[0].content,'turn 2');
  assert.equal(history.at(-1).content,'turn 7');
  assert.throws(()=>appendPrivateHistory(history,{role:'system',content:'override'}));
});

test('help result keeps text data and only safe same-site source paths',()=>{
  const result=normalizeHelpResult({
    answer:'<b>plain text</b>',confidence:1.4,mode:'model',request_id:'req-1',
    sources:[
      {label:'Join',url:'/join.html'},
      {label:'Bad',url:'javascript:alert(1)'},
      {label:'External',url:'https://evil.example'},
    ],
  });
  assert.equal(result.answer,'<b>plain text</b>');
  assert.equal(result.confidence,1);
  assert.equal(result.mode,'model');
  assert.deepEqual(result.sources,[{label:'Join',url:'/join.html'}]);
});

test('askHynoe calls only the private ask-hynoe function with bounded history/page context', async()=>{
  const calls=[];
  const client={functions:{async invoke(name,options){calls.push([name,options]);return {data:{answer:'Use hynoesmp.com',sources:[{label:'Join',url:'/join.html'}],confidence:.9,mode:'retrieval',request_id:'r1'},error:null};}}};
  const result=await askHynoe(client,{question:'How do I join?',history:[{role:'user',content:'Earlier'}],pagePath:'/join.html'});
  assert.equal(result.answer,'Use hynoesmp.com');
  assert.deepEqual(calls,[['ask-hynoe',{body:{question:'How do I join?',history:[{role:'user',content:'Earlier'}],page_path:'/join.html'}}]]);
});

test('askHynoe rejects missing client, function errors, and timeout cleanly',async()=>{
  await assert.rejects(()=>askHynoe(null,{question:'hello'}),/unavailable/i);
  const broken={functions:{async invoke(){return {data:null,error:new Error('bad')};}}};
  await assert.rejects(()=>askHynoe(broken,{question:'hello'}),/could not answer/i);
  const slow={functions:{invoke(){return new Promise(()=>{});}}};
  await assert.rejects(()=>askHynoe(slow,{question:'hello',timeoutMs:10}),/taking too long/i);
});

test('Ask Hynoe browser core never persists transcript or posts to Global Chat',async()=>{
  const source=await readFile(new URL('../assets/ask-hynoe.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(source,/localStorage|sessionStorage|site_chat_messages|sendSiteMessage|GLOBAL CHAT/i);
  assert.match(source,/functions\.invoke\(['"]ask-hynoe['"]/);
});
