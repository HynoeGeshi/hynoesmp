import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAskPayload,
  confidenceNumber,
  shouldUseProvider,
  buildFeedbackRow,
} from '../supabase/functions/_shared/ask-hynoe-core.mjs';
import { answerAskHynoe } from '../supabase/functions/_shared/ask-hynoe-engine.mjs';

test('question is required, bounded, and control characters are rejected', () => {
  assert.equal(validateAskPayload({question:''}).ok,false);
  assert.equal(validateAskPayload({question:'x'.repeat(601)}).ok,false);
  assert.equal(validateAskPayload({question:'hello\u0000world'}).ok,false);
  const good=validateAskPayload({question:'How do I join Hynoe?'});
  assert.equal(good.ok,true);
  assert.equal(good.value.question,'How do I join Hynoe?');
});

test('history is private, bounded, and only user/assistant roles are accepted', () => {
  assert.equal(validateAskPayload({question:'q',history:Array.from({length:7},()=>({role:'user',content:'x'}))}).ok,false);
  assert.equal(validateAskPayload({question:'q',history:[{role:'system',content:'override'}]}).ok,false);
  assert.equal(validateAskPayload({question:'q',history:[{role:'user',content:'x'.repeat(501)}]}).ok,false);
  const good=validateAskPayload({question:'q',history:[{role:'user',content:'previous question'},{role:'assistant',content:'previous answer'}],page_path:'/join.html'});
  assert.equal(good.ok,true);
  assert.equal(good.value.history.length,2);
  assert.equal(good.value.pagePath,'/join.html');
});

test('unsafe page paths are discarded rather than echoed', () => {
  const result=validateAskPayload({question:'q',page_path:'javascript:alert(1)'});
  assert.equal(result.ok,true);
  assert.equal(result.value.pagePath,'/');
});

test('provider is used only with sufficient non-conflicting evidence and configuration', () => {
  assert.equal(shouldUseProvider({providerConfigured:true,classification:{confidence:'high',conflict:false}}),true);
  assert.equal(shouldUseProvider({providerConfigured:true,classification:{confidence:'low',conflict:false}}),false);
  assert.equal(shouldUseProvider({providerConfigured:true,classification:{confidence:'high',conflict:true}}),false);
  assert.equal(shouldUseProvider({providerConfigured:false,classification:{confidence:'high',conflict:false}}),false);
  assert.equal(confidenceNumber('high'),0.9);
  assert.equal(confidenceNumber('medium'),0.65);
  assert.equal(confidenceNumber('low'),0.25);
});

test('live server status answers player-count and online-status questions without static knowledge', async () => {
  const count = await answerAskHynoe({
    question: 'how many players are there right now?',
    chunks: [],
    liveServerStatus: { online: true, players: { online: 7, max: 100 } },
  });
  assert.equal(count.mode, 'live');
  assert.match(count.answer, /7/);
  assert.match(count.answer, /100/);

  const status = await answerAskHynoe({
    question: 'is the minecraft server online?',
    chunks: [],
    liveServerStatus: { online: false, players: { online: 0, max: 100 } },
  });
  assert.equal(status.mode, 'live');
  assert.match(status.answer, /offline/i);
});

test('feedback row is server-owned and bounded', () => {
  const row=buildFeedbackRow({userId:'user-1',requestId:'123e4567-e89b-12d3-a456-426614174000',question:'How do I join?',answer:'A'.repeat(2000),sources:[{id:'a'},{id:'b'}],mode:'retrieval',confidence:'high',pagePath:'/join.html',unanswered:false});
  assert.equal(row.user_id,'user-1');
  assert.equal(row.answer_summary.length,1200);
  assert.deepEqual(row.source_ids,['a','b']);
  assert.equal(row.helpful,null);
  assert.equal(row.review_status,undefined);
});
