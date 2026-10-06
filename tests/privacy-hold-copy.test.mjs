import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('live Hall of Legends never implies score publishing is automatic', () => {
  const html = read('watch.html');
  const ui = read('assets/watch.mjs');
  const transport = read('assets/leaderboard-live.mjs');

  assert.match(html, /GLOBAL OUTPOST LADDER · LIVE RANKINGS/i);
  assert.match(html, /Publishing your own score is optional and off by default/i);
  assert.match(html, /stays local until you explicitly opt in/i);
  assert.doesNotMatch(html, /GLOBAL SYNC PAUSED/i);
  assert.match(ui, /leaderboardOptedIn&&/);
  assert.match(ui, /!GLOBAL_BOARD_ENABLED\|\|!leaderboardOptedIn/);
  assert.match(transport, /hynoeLegendOptInV1/);
  assert.match(transport, /leader-opt-in/);
  assert.doesNotMatch(transport, /setItem\(OPT_IN_KEY,'yes'\).*DOMContentLoaded/s);
});
