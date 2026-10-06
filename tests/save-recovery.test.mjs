import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as G from '../assets/watch-game.mjs';
import { chooseSave, recoverBestLocalSave, CURRENT_SAVE_KEY, LEGACY_SAVE_KEY } from '../assets/save-recovery.mjs';

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

  const selected = chooseSave(JSON.stringify(current), JSON.stringify(legacy));
  assert.equal(selected.source, 'legacy');
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

  const selected = chooseSave(JSON.stringify(current), JSON.stringify(legacy));
  assert.equal(selected.source, 'current');
});

test('recovery copies the richer legacy save forward without deleting the backup', () => {
  const current = G.fresh(1_000_000);
  const legacy = G.fresh(900_000);
  legacy.total = 250_000;
  legacy.blocks = 320;
  legacy.prestige = 2;
  const store = new Map([
    [CURRENT_SAVE_KEY, JSON.stringify(current)],
    [LEGACY_SAVE_KEY, JSON.stringify(legacy)],
  ]);
  const storage = {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: key => store.delete(key),
  };
  const result = recoverBestLocalSave(storage);
  assert.equal(result.recovered, true);
  assert.equal(JSON.parse(store.get(CURRENT_SAVE_KEY)).total, 250_000);
  assert.equal(JSON.parse(store.get(LEGACY_SAVE_KEY)).total, 250_000);
});

test('watch page loads recovery preloader before the game module', () => {
  const html = readFileSync(new URL('../watch.html', import.meta.url), 'utf8');
  const recovery = html.indexOf('assets/save-recovery.mjs');
  const game = html.indexOf('assets/watch.mjs');
  assert.ok(recovery >= 0, 'save recovery preloader must be included');
  assert.ok(game >= 0, 'watch module must be included');
  assert.ok(recovery < game, 'save recovery must run before watch.mjs');
});

test('legacy save is never deleted by recovery code', () => {
  const source = readFileSync(new URL('../assets/save-recovery.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /removeItem\(LEGACY_SAVE_KEY\)/);
});
