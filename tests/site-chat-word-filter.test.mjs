import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMessageBody } from '../supabase/functions/_shared/site-chat-core.mjs';

test('server message validation blocks severe slurs including simple evasion', () => {
  for (const value of [
    'you nigger',
    'you n1gg3r',
    'f a g g o t',
    'k1ke',
    'ch!nk',
    'sp1c',
  ]) {
    const result = validateMessageBody(value);
    assert.equal(result.ok, false, value);
    assert.equal(result.code, 'filtered_content');
  }
});

test('server message validation blocks targeted self-harm harassment', () => {
  for (const value of ['kill yourself', 'kys']) {
    const result = validateMessageBody(value);
    assert.equal(result.ok, false, value);
    assert.equal(result.code, 'filtered_content');
  }
});

test('server word filter does not ban ordinary profanity or innocent substrings', () => {
  for (const value of [
    'damn this boss is hard as fuck',
    'that was bullshit lol',
    'I sniggered at the joke',
    'class assignment',
  ]) {
    assert.equal(validateMessageBody(value).ok, true, value);
  }
});
