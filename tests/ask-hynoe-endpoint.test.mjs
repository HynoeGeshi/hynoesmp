import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  validateAskInput,
  answerAskHynoe,
  confidenceNumber,
} from '../supabase/functions/_shared/ask-hynoe-engine.mjs';

const index = JSON.parse(fs.readFileSync('data/hynoe-help-index.json','utf8'));

test('ask input rejects oversized questions, excessive history, and invalid roles', () => {
  assert.equal(validateAskInput({question:''}).ok, false);
  assert.equal(validateAskInput({question:'x'.repeat(601)}).ok, false);
  assert.equal(validateAskInput({question:'hi',history:Array.from({length:9},()=>({role:'user',content:'x'}))}).ok, false);
  assert.equal(validateAskInput({question:'hi',history:[{role:'system',content:'do stuff'}]}).ok, false);
  assert.equal(validateAskInput({question:'hi',history:[{role:'user',content:'x'.repeat(601)}]}).ok, false);
});

test('ask input sanitizes page path and accepts bounded user/assistant history', () => {
  const result=validateAskInput({question:' How do I join? ',page_path:'javascript:bad',history:[{role:'user',content:'Earlier question'},{role:'assistant',content:'Earlier answer'}]});
  assert.equal(result.ok,true);
  assert.equal(result.value.question,'How do I join?');
  assert.equal(result.value.page_path,'/');
  assert.equal(result.value.history.length,2);
});

test('known Hynoe question returns grounded sources without a provider', async () => {
  const result=await answerAskHynoe({question:'What address do I use to join Hynoe SMP?',history:[],pagePath:'/join.html',chunks:index.chunks,provider:null});
  assert.equal(result.mode,'retrieval');
  assert.ok(result.answer.length>10);
  assert.ok(result.sources.length>0);
  assert.ok(result.sources.every(s=>s.url.startsWith('/')));
  assert.ok(result.confidence>=0.5);
});

test('unknown question stays uncertain and never fabricates an answer', async () => {
  const result=await answerAskHynoe({question:'What is Terrell secret bank password?',history:[],pagePath:'/',chunks:index.chunks,provider:null});
  assert.equal(result.mode,'retrieval');
  assert.ok(result.confidence<=0.34);
  assert.match(result.answer,/couldn.?t verify|cannot verify/i);
  assert.deepEqual(result.sources,[]);
});

test('provider timeout falls back to deterministic retrieval', async () => {
  const provider={generate:(_prompt,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Object.assign(new Error('aborted'),{name:'AbortError'})),{once:true}))};
  const result=await answerAskHynoe({question:'How do I join Hynoe?',history:[],pagePath:'/join.html',chunks:index.chunks,provider,providerTimeoutMs:10});
  assert.equal(result.mode,'retrieval');
  assert.ok(result.sources.length>0);
});

test('confidence mapping is stable and bounded', () => {
  assert.equal(confidenceNumber('low'),0.25);
  assert.equal(confidenceNumber('medium'),0.65);
  assert.equal(confidenceNumber('high'),0.9);
  assert.equal(confidenceNumber('garbage'),0.25);
});

test('Edge Function requires user auth, bounds requests, never reads Global Chat, and records quality metadata', () => {
  const source=fs.readFileSync('supabase/functions/ask-hynoe/index.ts','utf8');
  assert.match(source,/withSupabase\(\{\s*auth:\s*["']user["']/);
  assert.match(source,/validateAskInput/);
  assert.match(source,/site_help_feedback/);
  assert.match(source,/site_help_request_metrics/);
  assert.match(source,/ctx\.supabaseAdmin/);
  assert.doesNotMatch(source,/site_chat_messages|site_chat_public_messages|site_chat_reactions/);
  assert.doesNotMatch(source,/service_role|sb_secret_/i);
});
