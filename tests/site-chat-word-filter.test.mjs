import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMessageBody } from '../supabase/functions/_shared/site-chat-core.mjs';
import { containsBlockedChatContent, sanitizeSiteChatMessages } from '../assets/site-social-core.mjs';

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

test('browser and Edge agree on punctuation, literal threat quantities, and leetspeak', () => {
  for (const value of ['kys!', 'I will hurt you!', 'I have 3 bombs.', 'I will plant 7 bombs', 'send me nud3s!']) {
    assert.equal(validateMessageBody(value).code, 'filtered_content', value);
    assert.equal(containsBlockedChatContent(value), true, value);
  }
  for (const value of ['I have 3 pumpkins!', '3 more players!', 'The boss is carrying 4 bombs in Minecraft']) {
    assert.equal(validateMessageBody(value).ok, true, value);
    assert.equal(containsBlockedChatContent(value), false, value);
  }
});

test('the public feed masks a blocked alias and preserves normal message behavior', () => {
  const output = sanitizeSiteChatMessages([
    { id: 'one', display_name: 'kys!', body: 'hello' },
    { id: 'two', display_name: 'Alex', body: 'that was shit!' },
    { id: 'three', display_name: 'Sam', body: 'I have 3 bombs.' },
  ]);
  assert.deepEqual(output, [
    { id: 'one', display_name: 'Player', body: 'hello' },
    { id: 'two', display_name: 'Alex', body: 'that was ****!' },
  ]);
});
