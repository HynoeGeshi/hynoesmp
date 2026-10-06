import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as G from '../assets/watch-game.mjs';

test('save recovery prefers richer legacy progress over an accidental fresh current save', () => {
  const now = 1_000_000;
  const current = G.fresh(now);
  current.savedAt = now;

  const legacy = G.fresh(now - 50_000);
  legacy.total = 250_000;
  legacy.ore = 80_000;
  legacy.run = 125_000;
  legacy.strikes = 4_000;
  legacy.blocks = 320;
  legacy.prestige = 2;
  legacy.progress.chapter = 5;
  legacy.progress.crewDeck.caches = 7;
  legacy.savedAt = now - 50_000;

  const selected = G.selectBestSave(JSON.stringify(current), JSON.stringify(legacy), now);
  assert.equal(selected.source, 'legacy');
  assert.equal(selected.state.total, 250_000);
  assert.equal(selected.state.blocks, 320);
  assert.equal(selected.state.prestige, 2);
  assert.equal(selected.state.progress.chapter, 5);
});

test('save recovery keeps a genuinely more advanced current save', () => {
  const now = 1_000_000;
  const current = G.fresh(now);
  current.total = 500_000;
  current.ore = 100_000;
  current.run = 200_000;
  current.blocks = 500;
  current.prestige = 3;

  const legacy = G.fresh(now - 100_000);
  legacy.total = 100_000;
  legacy.blocks = 150;
  legacy.prestige = 1;

  const selected = G.selectBestSave(JSON.stringify(current), JSON.stringify(legacy), now);
  assert.equal(selected.source, 'current');
  assert.equal(selected.state.total, 500_000);
});

test('watch loader preserves legacy backup while migrating recovered progress forward', () => {
  const source = readFileSync(new URL('../assets/watch.mjs', import.meta.url), 'utf8');
  assert.match(source, /selectBestSave\(current,legacy/);
  assert.match(source, /selected\.source==='legacy'/);
  assert.match(source, /localStorage\.setItem\(KEY,JSON\.stringify\(state\)\)/);
  assert.doesNotMatch(source, /removeItem\(LEGACY_KEY\)/);
});
