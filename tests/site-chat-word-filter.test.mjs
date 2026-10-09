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

test('server filter censors ordinary profanity before accepting the message', () => {
  assert.deepEqual(validateMessageBody('This fucking boss is shit.'), {
    ok: true,
    value: 'This ******* boss is ****.',
  });
  assert.deepEqual(validateMessageBody('That was f.u.c.k.'), {
    ok: true,
    value: 'That was *.*.*.*.',
  });
});

test('server filter blocks explicit sexual solicitation and targeted or credible threats', () => {
  for (const value of ['send me nudes', 'I will kill you', 'go k.y.s.', 'ive got multiple bombs', 'I will plant a bomb']) {
    const result = validateMessageBody(value);
    assert.equal(result.ok, false, value);
    assert.equal(result.code, 'filtered_content');
  }
});

test('server filter preserves benign words and neutral educational discussion', () => {
  for (const value of [
    'I sniggered at the joke',
    'class assignment',
    'sex education matters',
  ]) {
    assert.deepEqual(validateMessageBody(value), { ok: true, value });
  }
});
