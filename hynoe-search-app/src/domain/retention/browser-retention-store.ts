import { emptyRetentionState, type RetentionStateV1 } from './types';

const STORAGE_KEY = 'hynoe.retention.v1';
const STORAGE_VERSION = 1;
const MAX_RECENT_QUERIES = 10;
const MAX_RECENT_PAGES = 12;

type StoredEnvelopeV1 = {
  version: 1;
  state: RetentionStateV1;
};

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isRetentionState(value: unknown): value is RetentionStateV1 {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<RetentionStateV1>;
  return isStringArray(state.recentQueries)
    && isStringArray(state.recentPageSlugs)
    && isStringArray(state.savedPageSlugs)
    && isStringArray(state.followedPageSlugs);
}

function unique(values: string[], max?: number): string[] {
  const result = [...new Set(values.filter(Boolean))];
  return typeof max === 'number' ? result.slice(0, max) : result;
}

function sanitize(state: RetentionStateV1): RetentionStateV1 {
  return {
    recentQueries: unique(state.recentQueries, MAX_RECENT_QUERIES),
    recentPageSlugs: unique(state.recentPageSlugs, MAX_RECENT_PAGES),
    savedPageSlugs: unique(state.savedPageSlugs),
    followedPageSlugs: unique(state.followedPageSlugs),
  };
}

function writeRetentionState(state: RetentionStateV1): void {
  const storage = getStorage();
  if (!storage) return;
  const envelope: StoredEnvelopeV1 = { version: STORAGE_VERSION, state: sanitize(state) };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // Device-local retention is optional and must never block product use.
  }
}

function prependUnique(values: string[], value: string, max: number): string[] {
  return [value, ...values.filter((item) => item !== value)].slice(0, max);
}

export function readRetentionState(): RetentionStateV1 {
  const storage = getStorage();
  if (!storage) return emptyRetentionState();

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return emptyRetentionState();
    const parsed = JSON.parse(raw) as Partial<StoredEnvelopeV1>;
    if (parsed.version !== STORAGE_VERSION || !isRetentionState(parsed.state)) return emptyRetentionState();
    return sanitize(parsed.state);
  } catch {
    return emptyRetentionState();
  }
}

export function recordQuery(query: string): void {
  const value = query.trim();
  if (!value) return;
  const state = readRetentionState();
  state.recentQueries = prependUnique(state.recentQueries, value, MAX_RECENT_QUERIES);
  writeRetentionState(state);
}

export function recordPageView(slug: string): void {
  const value = slug.trim();
  if (!value) return;
  const state = readRetentionState();
  state.recentPageSlugs = prependUnique(state.recentPageSlugs, value, MAX_RECENT_PAGES);
  writeRetentionState(state);
}

export function toggleSaved(slug: string): boolean {
  const value = slug.trim();
  if (!value) return false;
  const state = readRetentionState();
  const exists = state.savedPageSlugs.includes(value);
  state.savedPageSlugs = exists
    ? state.savedPageSlugs.filter((item) => item !== value)
    : [value, ...state.savedPageSlugs];
  writeRetentionState(state);
  return !exists;
}

export function toggleFollowed(slug: string): boolean {
  const value = slug.trim();
  if (!value) return false;
  const state = readRetentionState();
  const exists = state.followedPageSlugs.includes(value);
  state.followedPageSlugs = exists
    ? state.followedPageSlugs.filter((item) => item !== value)
    : [value, ...state.followedPageSlugs];
  writeRetentionState(state);
  return !exists;
}

export function clearRetentionState(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Optional local state can be discarded silently when storage is blocked.
  }
}
