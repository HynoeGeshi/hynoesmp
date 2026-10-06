import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeForModeration,moderateMessage} from '../relay/worker.mjs';

test('ordinary profanity is censored even when spaced or punctuation-separated',()=>{
 for(const text of ['that is f.u.c.k wild','that is f u c k wild']){
  const result=moderateMessage(text);assert.equal(result.action,'censor');assert.doesNotMatch(result.text,/f[ .]u[ .]c[ .]k/i);
 }
});

test('severe phrases survive common leet and punctuation normalization',()=>{
 assert.match(normalizeForModeration('k.!.l.l y.0.u'),/kill you|killyou/);
 assert.equal(moderateMessage('k.!.l.l y.0.u').action,'block');
});

test('moderation does not use naive substring matching on innocent words',()=>{
 for(const text of ['The Scunthorpe route is open','assassination challenge','classic brasswork'])assert.equal(moderateMessage(text).action,'allow');
});
