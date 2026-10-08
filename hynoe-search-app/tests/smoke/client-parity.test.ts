import { describe, expect, it } from 'vitest';
import { flagshipPages } from '@/data/flagship-pages';
import { searchPages } from '@/domain/search/search-pages';

describe('Hynoe projects have the same discovery rules as client pages', () => {
  it('does not flag the owner projects for automatic featured placement', () => {
    expect(flagshipPages.every(page => page.featured === false)).toBe(true);
  });
  it('ignores featured flags when ordering an unfiltered search', () => {
    const sample = flagshipPages.find(page => page.slug === 'hynoe-flicks')!;
    const client = { ...sample, id: 'client', slug: 'client', name: 'A Client Studio', featured: false };
    const owner = { ...sample, featured: true };
    expect(searchPages([owner, client], '').map(result => result.page.name)).toEqual(['A Client Studio', 'Hynoe Flicks']);
  });
  it('keeps owner services discoverable in the same category search as clients', () => {
    expect(searchPages(flagshipPages, 'photography', { pageType:'service_provider' }).map(result => result.page.slug)).toContain('hynoe-flicks');
    expect(searchPages(flagshipPages, 'browser game', { pageType:'digital_product' }).map(result => result.page.slug)).toContain('hynoe-outpost');
  });
});
