import { describe, expect, it } from 'vitest';
import { searchPages } from '@/domain/search/search-pages';
import { publicBusinessPages } from '@/data/public-businesses';
import { flagshipPages } from '@/data/flagship-pages';

const pages = [...flagshipPages, ...publicBusinessPages];
describe('public-directory search specificity', () => {
  it('does not match Adobe or Canva through unrelated words such as a or can', () => {
    expect(searchPages(pages, 'Adobe').map(result => result.page.slug)).toEqual(['directory-adobe']);
    expect(searchPages(pages, 'Canva').map(result => result.page.slug)).toEqual(['directory-canva']);
  });
  it('keeps useful forward prefixes and actual location matches', () => {
    expect(searchPages(pages, 'ado')[0].page.slug).toBe('directory-adobe');
    expect(searchPages(pages, 'photographer')[0].page.slug).toBe('hynoe-flicks');
    expect(searchPages(pages, 'Chicago').map(result => result.page.slug)).toEqual(['directory-chicago-music-exchange']);
  });
  it('empty descriptions and unmatched words never create false results', () => {
    const empty = { ...flagshipPages[0], name: 'Other', categories: [], tags: [], summary: '', description: '' };
    expect(searchPages([empty], 'unmatched')).toEqual([]);
    expect(searchPages(pages, 'zzzzunlistedqvkjz2027')).toEqual([]);
  });
});
