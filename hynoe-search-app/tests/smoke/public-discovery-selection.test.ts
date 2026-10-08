import { describe, expect, it } from 'vitest';
import type { HynoePage } from '@/domain/pages/types';
import { selectPublicDiscovery } from '@/domain/pages/public-discovery';

const make = (slug: string, extra: Partial<HynoePage> = {}): HynoePage => ({
  id: slug, slug, name: slug, pageType: 'creator', summary: 'Test Page', description: 'Test fixture only.',
  categories: [], tags: [], status: 'published', featured: false, canonicalUrl: 'https://example.test', modules: [], ...extra,
});

describe('public discovery selection', () => {
  it('keeps featured placement separate from ordinary public visibility', () => {
    const a = make('chosen', { featured: true }), b = make('independent');
    expect(selectPublicDiscovery([a, b])).toEqual({ featured: [a], community: [b] });
  });
  it('excludes drafts even when marked featured', () => {
    expect(selectPublicDiscovery([make('hidden', { status: 'draft', featured: true })])).toEqual({ featured: [], community: [] });
  });
  it('rejects unsafe paths and blank identities', () => {
    expect(selectPublicDiscovery([make('../private'), make('https://bad.example'), make('blank', { name: ' ' })]))
      .toEqual({ featured: [], community: [] });
  });
  it('deduplicates by slug without reordering or modifying the source', () => {
    const first = Object.freeze(make('same', { featured: true })), other = Object.freeze(make('other'));
    const source = Object.freeze([first, other, make('same')]);
    expect(selectPublicDiscovery(source)).toEqual({ featured: [first], community: [other] });
  });
  it('bounds homepage output to three features and six community cards', () => {
    const source = Array.from({ length: 30 }, (_, i) => make(`page-${i}`, { featured: i < 10 }));
    const result = selectPublicDiscovery(source);
    expect(result.featured).toHaveLength(3);
    expect(result.community).toHaveLength(6);
  });
  it('never infers featured status from publication alone', () => {
    const page = make('ordinary');
    expect(selectPublicDiscovery([page])).toEqual({ featured: [], community: [page] });
  });
});
