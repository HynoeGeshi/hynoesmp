import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearRetentionState,
  readRetentionState,
  recordPageView,
  recordQuery,
  toggleFollowed,
  toggleSaved,
} from '@/domain/retention/browser-retention-store';

const STORAGE_KEY = 'hynoe.retention.v1';

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('browser retention store', () => {
  it('returns an empty v1 state when nothing has been stored', () => {
    expect(readRetentionState()).toEqual({
      recentQueries: [],
      recentPageSlugs: [],
      savedPageSlugs: [],
      followedPageSlugs: [],
    });
  });

  it('de-duplicates and caps recent queries at 10 with newest first', () => {
    for (let index = 0; index < 12; index += 1) recordQuery(`query-${index}`);
    recordQuery('query-8');

    const state = readRetentionState();
    expect(state.recentQueries).toHaveLength(10);
    expect(state.recentQueries[0]).toBe('query-8');
    expect(new Set(state.recentQueries).size).toBe(10);
  });

  it('de-duplicates and caps recent Page slugs at 12 with newest first', () => {
    for (let index = 0; index < 14; index += 1) recordPageView(`page-${index}`);
    recordPageView('page-9');

    const state = readRetentionState();
    expect(state.recentPageSlugs).toHaveLength(12);
    expect(state.recentPageSlugs[0]).toBe('page-9');
    expect(new Set(state.recentPageSlugs).size).toBe(12);
  });

  it('toggles saved and followed slugs without duplicates', () => {
    expect(toggleSaved('hynoe-smp')).toBe(true);
    expect(toggleSaved('hynoe-smp')).toBe(false);
    expect(toggleFollowed('hynoe-flicks')).toBe(true);
    expect(toggleFollowed('hynoe-flicks')).toBe(false);
    expect(readRetentionState().savedPageSlugs).toEqual([]);
    expect(readRetentionState().followedPageSlugs).toEqual([]);
  });

  it('treats malformed and stale storage as empty state', () => {
    window.localStorage.setItem(STORAGE_KEY, '{broken-json');
    expect(readRetentionState().recentQueries).toEqual([]);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, state: { recentQueries: ['old'] } }));
    expect(readRetentionState().recentQueries).toEqual([]);
  });

  it('degrades to empty state when storage access is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(readRetentionState()).toEqual({
      recentQueries: [],
      recentPageSlugs: [],
      savedPageSlugs: [],
      followedPageSlugs: [],
    });
    expect(() => recordQuery('safe')).not.toThrow();
  });

  it('clears all device-local retention state', () => {
    recordQuery('minecraft');
    recordPageView('hynoe-smp');
    toggleSaved('hynoe-smp');
    clearRetentionState();
    expect(readRetentionState()).toEqual({
      recentQueries: [],
      recentPageSlugs: [],
      savedPageSlugs: [],
      followedPageSlugs: [],
    });
  });
});
