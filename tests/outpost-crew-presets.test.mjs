import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../assets/watch-game.mjs';
import {PRESET_SLOTS, normalizePresets, capturePreset, previewPreset, applyPreset} from '../assets/outpost-crew-presets.mjs';

function crewState() {
  const state = G.fresh(1000);
  state.progress.crewDeck.cards = {
    coalhand: {stars: 2, shards: 1},
    riveter: {stars: 1, shards: 0},
    copperjack: {stars: 3, shards: 2},
    lantern: {stars: 1, shards: 0}
  };
  state.progress.crewDeck.active = ['lantern'];
  return state;
}

test('normalization preserves exactly three slots and distinguishes an empty saved team', () => {
  const raw = {mining: ['coalhand', 'riveter'], caves: [], dispatch: null, custom: ['lantern']};
  const result = normalizePresets(raw);
  assert.deepEqual(PRESET_SLOTS.map(slot => slot.id), ['mining', 'caves', 'dispatch']);
  assert.deepEqual(result, {mining: ['coalhand', 'riveter'], caves: [], dispatch: null});
  result.mining.push('lantern');
  assert.deepEqual(raw.mining, ['coalhand', 'riveter']);
  assert.deepEqual(normalizePresets(null), {mining: null, caves: null, dispatch: null});
});

test('normalization rejects entire malformed lineups instead of silently applying a partial team', () => {
  for (const invalid of [
    'coalhand', {}, ['unknown'], ['coalhand', 'unknown'], ['coalhand', 'coalhand'],
    ['coalhand', 'riveter', 'copperjack', 'lantern'], [null], [1], new Array(1)
  ]) {
    assert.equal(normalizePresets({mining: invalid}).mining, null);
  }
  assert.equal(normalizePresets(Object.create({mining: ['coalhand']})).mining, null);
});

test('capturing saves a detached current lineup without changing game state or the other slots', () => {
  const state = crewState();
  const before = structuredClone(state);
  const raw = {mining: ['coalhand'], caves: ['riveter'], dispatch: null};
  const captured = capturePreset(state, raw, 'dispatch');
  assert.deepEqual(captured, {mining: ['coalhand'], caves: ['riveter'], dispatch: ['lantern']});
  assert.deepEqual(state, before);
  assert.deepEqual(raw, {mining: ['coalhand'], caves: ['riveter'], dispatch: null});
  captured.dispatch.push('coalhand');
  assert.deepEqual(state.progress.crewDeck.active, ['lantern']);
});

test('a deliberately captured empty team can clear active crew but an unsaved slot cannot', () => {
  const state = crewState();
  assert.equal(previewPreset(state, {}, 'mining').available, false);
  state.progress.crewDeck.active = [];
  const saved = capturePreset(state, {}, 'mining');
  assert.deepEqual(saved.mining, []);
  state.progress.crewDeck.active = ['coalhand'];
  assert.equal(previewPreset(state, saved, 'mining').available, true);
  assert.deepEqual(applyPreset(state, saved, 'mining'), {ok: true, reason: ''});
  assert.deepEqual(state.progress.crewDeck.active, []);
});

test('preview uses saved team stars and actual same-faction bonuses without mutating current crew', () => {
  const state = crewState();
  const before = structuredClone(state);
  const preview = previewPreset(state, {mining: ['coalhand', 'riveter', 'copperjack']}, 'mining');
  assert.equal(preview.available, true);
  assert.equal(preview.reason, '');
  assert.deepEqual(preview.ids, ['coalhand', 'riveter', 'copperjack']);
  assert.deepEqual(preview.names, ['Mara Coalhand', 'June Riveter', 'Copper Jack']);
  assert.equal(preview.bonuses.power, 780);
  assert.equal(preview.bonuses.synergy, 0.15);
  assert.ok(Math.abs(preview.bonuses.strike - 1.52) < 1e-12);
  assert.ok(Math.abs(preview.bonuses.idle - 1.26) < 1e-12);
  assert.equal(preview.bonuses.supply, 1.15);
  assert.deepEqual(state, before);
});

test('preview never invents faction synergy for mixed or partial lineups', () => {
  const state = crewState();
  const mixed = previewPreset(state, {caves: ['coalhand', 'riveter', 'lantern']}, 'caves');
  assert.equal(mixed.bonuses.synergy, 0);
  assert.equal(mixed.bonuses.power, 320);
  assert.equal(mixed.bonuses.supply, 1.06);
  assert.equal(previewPreset(state, {mining: ['coalhand', 'riveter']}, 'mining').bonuses.synergy, 0);
});

for (const [name, lock, reason] of [
  ['a cave crossing', state => { state.progress.run = {room: 1, ready: false}; }, /cave/i],
  ['an unclaimed completed cave', state => { state.progress.run = {room: 3, ready: true}; }, /cave/i],
  ['a relic dispatch', state => { state.expedition = {minutes: 5, ends: 1001}; }, /dispatch|relic/i],
  ['a Guardian encounter', state => { state.guardian = {hp: 10, crewHp: 40}; }, /guardian/i]
]) {
  test(`applying refuses ${name} atomically and explains the lock`, () => {
    const state = crewState();
    lock(state);
    const before = structuredClone(state);
    const raw = {mining: ['coalhand', 'riveter', 'copperjack']};
    const preview = previewPreset(state, raw, 'mining');
    assert.equal(preview.available, false);
    assert.match(preview.reason, reason);
    assert.equal(preview.bonuses.power, 780);
    const result = applyPreset(state, raw, 'mining');
    assert.equal(result.ok, false);
    assert.match(result.reason, reason);
    assert.deepEqual(state, before);
  });
}

test('a stationed target refuses the whole preset without unassigning any station', () => {
  const state = crewState();
  state.progress.command.stations.quarry.crew = 'copperjack';
  const before = structuredClone(state);
  const raw = {mining: ['coalhand', 'riveter', 'copperjack']};
  const preview = previewPreset(state, raw, 'mining');
  assert.equal(preview.available, false);
  assert.match(preview.reason, /Copper Jack.*station|station.*Copper Jack/i);
  assert.equal(applyPreset(state, raw, 'mining').ok, false);
  assert.deepEqual(state, before);
});

test('deleted or corrupt owned cards refuse the whole preset and never show invalid bonuses', () => {
  for (const invalid of [undefined, null, {}, {stars: 0, shards: 0}, {stars: 6, shards: 0},
    {stars: 1.5, shards: 0}, {stars: 1}, {stars: 1, shards: -1}, {stars: 1, shards: Infinity}]) {
    const state = crewState();
    if (invalid === undefined) delete state.progress.crewDeck.cards.copperjack;
    else state.progress.crewDeck.cards.copperjack = invalid;
    const before = structuredClone(state);
    const raw = {mining: ['coalhand', 'riveter', 'copperjack']};
    const preview = previewPreset(state, raw, 'mining');
    assert.equal(preview.available, false);
    assert.ok(preview.reason.length > 0);
    assert.equal(preview.bonuses, null);
    assert.equal(applyPreset(state, raw, 'mining').ok, false);
    assert.deepEqual(state, before);
  }
});

test('capture refuses a partial, duplicated or stationed current team without changing anything', () => {
  for (const ids of [['coalhand', 'missing'], ['coalhand', 'coalhand'], ['coalhand', 'copperjack']]) {
    const state = crewState();
    state.progress.crewDeck.active = ids;
    state.progress.command.stations.quarry.crew = 'copperjack';
    const before = structuredClone(state);
    assert.equal(capturePreset(state, {mining: ['lantern']}, 'mining'), null);
    assert.deepEqual(state, before);
  }
});

test('malformed preset slots and incomplete game state are safe refusals', () => {
  const state = crewState();
  const before = structuredClone(state);
  for (const raw of [{}, {mining: ['coalhand', 'unknown']}, {mining: ['coalhand', 'coalhand']}]) {
    assert.equal(applyPreset(state, raw, 'mining').ok, false);
    assert.deepEqual(state, before);
  }
  assert.equal(capturePreset(state, {}, 'custom'), null);
  assert.equal(applyPreset(state, {custom: ['coalhand']}, 'custom').ok, false);
  for (const invalid of [null, {}, {progress: {}}, {progress: {crewDeck: {cards: {}, active: []}}}]) {
    assert.equal(previewPreset(invalid, {mining: []}, 'mining').available, false);
    assert.equal(applyPreset(invalid, {mining: []}, 'mining').ok, false);
    assert.equal(capturePreset(invalid, {}, 'mining'), null);
  }
});

test('successful apply changes only active crew and leaves resources, progress and preferences intact', () => {
  const state = crewState();
  state.ore = 54321;
  state.total = 60000;
  state.progress.bag.gold = 25;
  state.progress.command.stations.beacon.crew = 'lantern';
  state.progress.crewDeck.active = ['coalhand'];
  const before = structuredClone(state);
  const raw = {mining: ['copperjack', 'riveter']};
  const rawBefore = structuredClone(raw);
  assert.deepEqual(applyPreset(state, raw, 'mining'), {ok: true, reason: ''});
  before.progress.crewDeck.active = ['copperjack', 'riveter'];
  assert.deepEqual(state, before);
  assert.deepEqual(raw, rawBefore);
  state.progress.crewDeck.active.push('coalhand');
  assert.deepEqual(raw.mining, ['copperjack', 'riveter']);
});
