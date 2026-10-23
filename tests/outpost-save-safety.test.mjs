import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as G from '../assets/watch-game.mjs';
import { chooseSave, recoverBestLocalSave, CURRENT_SAVE_KEY, LEGACY_SAVE_KEY } from '../assets/save-recovery.mjs';

function playedSave() {
  const save = G.fresh(1_000);
  save.ore = save.total = save.run = 1_000;
  for (const id of ['coalhand', 'copperjack', 'ironheart']) {
    save.progress.crewDeck.cards[id] = { stars: 1, shards: 0 };
  }
  save.progress.crewDeck.active = ['coalhand', 'copperjack', 'ironheart'];
  return save;
}

function memoryStorage(current, legacy) {
  const store = new Map([
    [CURRENT_SAVE_KEY, current],
    [LEGACY_SAVE_KEY, legacy],
  ]);
  return {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
  };
}

test('recovery preserves current spending and crew reassignment even when legacy scores higher', () => {
  for (const timestamps of [true, false]) {
    const legacy = playedSave();
    const current = G.restore(JSON.stringify(legacy), 1_000);
    assert.equal(G.buy(current, 'pick'), true);
    assert.equal(G.toggleCrew(current, 'coalhand'), 'removed');
    assert.equal(G.assignStation(current, 'quarry', 'coalhand'), true);
    current.savedAt = 2_000;
    if (!timestamps) {
      delete current.savedAt;
      delete legacy.savedAt;
    }
    const currentRaw = JSON.stringify(current), legacyRaw = JSON.stringify(legacy);
    const storage = memoryStorage(currentRaw, legacyRaw);
    assert.deepEqual(recoverBestLocalSave(storage), { source: 'current', recovered: false });
    assert.equal(storage.getItem(CURRENT_SAVE_KEY), currentRaw);
    assert.equal(storage.getItem(LEGACY_SAVE_KEY), legacyRaw);
    assert.equal(current.ore, 970);
    assert.equal(current.progress.command.stations.quarry.crew, 'coalhand');
  }
});

test('depleted current progress is never mistaken for a pristine save', () => {
  const legacy = playedSave();
  const current = G.restore(JSON.stringify(legacy), 1_000);
  current.ore = 0;
  current.progress.bag.copper = 30;
  current.progress.insight = 5;
  assert.equal(G.upgradeStation(current, 'quarry'), true);
  assert.equal(G.toggleCrew(current, 'coalhand'), 'removed');
  assert.equal(current.progress.bag.copper, 0);
  assert.equal(current.progress.insight, 0);
  assert.equal(chooseSave(current, legacy).source, 'current');
});

test('permanent progress outside the old score prevents automatic whole-save replacement', () => {
  const changes = [
    ['research', s => { s.progress.research.precision = 1; }],
    ['equipment', s => { s.progress.gear.chisel = 1; }],
    ['materials', s => { s.progress.bag.coal = 1; }],
    ['insight', s => { s.progress.insight = 1; }],
    ['mastery', s => { s.progress.mastery = 1; }],
    ['station upgrade', s => { s.progress.command.stations.quarry.level = 2; }],
    ['station work', s => { s.progress.command.stations.quarry.work = 0.5; }],
    ['great work', s => { s.progress.command.works.depot = 1; }],
    ['recruitment marks', s => { s.progress.command.marks = 1; }],
  ];
  const legacy = playedSave();
  for (const [name, change] of changes) {
    const current = G.fresh(2_000);
    change(current);
    assert.equal(chooseSave(current, legacy).source, 'current', name);
  }
});

test('first legacy migration copies once and later reloads retain current play and the legacy backup', () => {
  const legacyRaw = JSON.stringify(playedSave());
  const storage = memoryStorage(null, legacyRaw);
  assert.deepEqual(recoverBestLocalSave(storage), { source: 'legacy', recovered: true });
  assert.equal(storage.getItem(CURRENT_SAVE_KEY), legacyRaw);
  assert.deepEqual(recoverBestLocalSave(storage), { source: 'current', recovered: false });
  const current = G.restore(storage.getItem(CURRENT_SAVE_KEY), 1_000);
  assert.equal(G.buy(current, 'pick'), true);
  assert.equal(G.toggleCrew(current, 'coalhand'), 'removed');
  const currentRaw = JSON.stringify(current);
  storage.setItem(CURRENT_SAVE_KEY, currentRaw);
  assert.deepEqual(recoverBestLocalSave(storage), { source: 'current', recovered: false });
  assert.equal(storage.getItem(CURRENT_SAVE_KEY), currentRaw);
  assert.equal(storage.getItem(LEGACY_SAVE_KEY), legacyRaw);
});

test('missing or corrupt current saves still recover from legacy without altering its backup', () => {
  const legacyRaw = JSON.stringify(playedSave());
  for (const current of [null, '{broken', JSON.stringify({ version: 9 }), JSON.stringify({ version: 1, ore: 'broken' })]) {
    const storage = memoryStorage(current, legacyRaw);
    assert.deepEqual(recoverBestLocalSave(storage), { source: 'legacy', recovered: true });
    assert.equal(storage.getItem(CURRENT_SAVE_KEY), legacyRaw);
    assert.equal(storage.getItem(LEGACY_SAVE_KEY), legacyRaw);
    assert.deepEqual(recoverBestLocalSave(storage), { source: 'current', recovered: false });
  }
});

test('an untouched current save can recover legacy even after autosave advances its clock', () => {
  const current = G.fresh(2_000);
  G.tick(current, 10, 12_000);
  const legacy = playedSave();
  assert.equal(chooseSave(current, legacy).source, 'legacy');
});

test('contract reward shown to the player matches the ore actually awarded', () => {
  const source = readFileSync(new URL('../assets/watch.mjs', import.meta.url), 'utf8');
  const expression = source.match(/\$\('quest-progress'\)\.textContent=([^;]+);/)[1];
  const display = new Function('state', 'G', 'fmt', `return ${expression};`);
  const state = G.fresh(1_000);
  state.run = 150;
  const fmt = n => new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(n);
  assert.equal(display(state, G, fmt), '150 / 150 mined this Legacy · Reward 42 ore');
  assert.equal(G.claim(state), true);
  assert.ok(Math.abs(state.ore - 42) < 1e-9);
});
