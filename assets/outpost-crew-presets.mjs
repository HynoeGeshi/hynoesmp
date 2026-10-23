import {CREW_CARDS, STATIONS, crewBonuses} from './watch-progression.mjs?v=20261023a';

export const PRESET_SLOTS = Object.freeze([
  Object.freeze({id: 'mining', label: 'Mining'}),
  Object.freeze({id: 'caves', label: 'Caves'}),
  Object.freeze({id: 'dispatch', label: 'Dispatch'})
]);

const definitions = new Map(CREW_CARDS.map(card => [card.id, card]));
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const knownSlot = slot => PRESET_SLOTS.some(item => item.id === slot);

function validIds(ids) {
  if (!Array.isArray(ids) || ids.length > 3) return false;
  const used = new Set();
  for (const id of ids) {
    if (typeof id !== 'string' || !definitions.has(id) || used.has(id)) return false;
    used.add(id);
  }
  return true;
}

// null is unsaved; [] is an intentionally saved empty lineup. Never salvage
// part of a malformed preset: applying a silently shortened team is unsafe.
export function normalizePresets(raw) {
  return Object.fromEntries(PRESET_SLOTS.map(({id}) => [
    id,
    record(raw) && Object.hasOwn(raw, id) && validIds(raw[id]) ? [...raw[id]] : null
  ]));
}

function currentDeck(state) {
  const deck = state?.progress?.crewDeck;
  const stations = state?.progress?.command?.stations;
  if (!record(deck) || !record(deck.cards) || !Array.isArray(deck.active) || !record(stations)) return null;
  if (!STATIONS.every(({id}) => Object.hasOwn(stations, id) && record(stations[id]) && typeof stations[id].crew === 'string')) return null;
  return deck;
}

function ownedCard(deck, id) {
  const card = Object.hasOwn(deck.cards, id) && deck.cards[id];
  return record(card) && Number.isInteger(card.stars) && card.stars >= 1 && card.stars <= 5 &&
    Number.isInteger(card.shards) && card.shards >= 0 && card.shards <= 100000;
}

function unavailableCrew(state, deck, ids) {
  for (const id of ids) {
    if (!ownedCard(deck, id)) return `${definitions.get(id).name} is missing or has invalid crew data.`;
    if (Object.values(state.progress.command.stations).some(station => station?.crew === id)) {
      return `${definitions.get(id).name} is assigned to a station. Unassign them before applying this team.`;
    }
  }
  return '';
}

export function capturePreset(state, raw, slot) {
  if (!knownSlot(slot)) return null;
  const deck = currentDeck(state);
  if (!deck || !validIds(deck.active) || unavailableCrew(state, deck, deck.active)) return null;
  const presets = normalizePresets(raw);
  presets[slot] = [...deck.active];
  return presets;
}

export function previewPreset(state, raw, slot) {
  const result = {available: false, reason: '', ids: [], names: [], bonuses: null};
  if (!knownSlot(slot)) return {...result, reason: 'Unknown preset slot.'};
  const ids = normalizePresets(raw)[slot];
  if (ids === null) return {...result, reason: 'No valid team is saved in this slot. Save your current team first.'};
  result.ids = ids;
  result.names = ids.map(id => definitions.get(id).name);
  const deck = currentDeck(state);
  if (!deck) return {...result, reason: 'Current crew data is unavailable.'};
  if (ids.some(id => !ownedCard(deck, id))) return {...result, reason: unavailableCrew(state, deck, ids)};
  result.bonuses = crewBonuses({crewDeck: {...deck, active: ids}});
  const unavailable = unavailableCrew(state, deck, ids);
  if (unavailable) return {...result, reason: unavailable};
  if (state.progress.run) return {...result, reason: 'Finish or retreat from the current cave before changing crew.'};
  if (state.expedition) return {...result, reason: 'Collect the current relic dispatch before changing crew.'};
  if (state.guardian) return {...result, reason: 'Finish the current Guardian encounter before changing crew.'};
  return {...result, available: true};
}

export function applyPreset(state, raw, slot) {
  const preview = previewPreset(state, raw, slot);
  if (!preview.available) return {ok: false, reason: preview.reason};
  // Validation is complete before the single write; never toggle members one
  // at a time or change stations/encounters while applying a saved lineup.
  state.progress.crewDeck.active = [...preview.ids];
  return {ok: true, reason: ''};
}
