import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('privacy hold UI never implies the global leaderboard is syncing', () => {
  const html = read('watch.html');
  const js = read('assets/watch.mjs');

  assert.match(html, /GLOBAL SYNC PAUSED/i);
  assert.match(html, /LOCAL ONLY · PRIVACY HOLD/i);
  assert.doesNotMatch(html, /id="podium-name-1">SYNCING</i);
  assert.doesNotMatch(html, /id="podium-name-2">WAITING</i);
  assert.match(js, /LOCAL ONLY · PRIVACY HOLD/);
  assert.doesNotMatch(js, /'Syncing · '\+tier\.name/);
  assert.doesNotMatch(js, /\['SYNCING','WAITING','FOR PLAYERS'\]/);
});
