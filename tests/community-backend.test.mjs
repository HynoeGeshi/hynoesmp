import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as mod from '../relay/worker.mjs';

const sourceUrl = new URL('../relay/worker.mjs', import.meta.url);
const source = await (await fetch(sourceUrl)).text();

// RED: these exports/behaviors do not exist in the Minecraft relay yet.
test('exports site-native moderation helpers', () => {
  assert.equal(typeof mod.normalizeForModeration, 'function');
  assert.equal(typeof mod.moderateMessage, 'function');
});

test('ordinary profanity is censored while severe abuse is blocked', () => {
  const ordinary = mod.moderateMessage('this is fucking wild');
  assert.equal(ordinary.action, 'censor');
  assert.match(ordinary.text, /f\*+/i);
  assert.doesNotMatch(ordinary.text, /fucking/i);

  const severe = mod.moderateMessage('k1ll yourself you n1gg3r');
  assert.equal(severe.action, 'block');
  assert.ok(severe.reason);
});

test('normalization catches punctuation and leet evasion without changing display input', () => {
  assert.match(mod.normalizeForModeration('f.u.c.k'), /fuck/i);
  assert.match(mod.normalizeForModeration('n1gg3r'), /nigger/i);
});

test('worker source has zero Bloom or Minecraft chat delivery dependency', () => {
  for (const forbidden of ['BLOOM_API_KEY', 'BLOOM_SERVER_ID', 'mc.bloom.host', 'tellraw @a']) {
    assert.equal(source.includes(forbidden), false, `found forbidden runtime dependency: ${forbidden}`);
  }
});
