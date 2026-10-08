import type { HynoePage } from '../pages/types';
import { normalizeQuery } from './normalize-query';
import type { SearchFilters, SearchResult } from './types';

function tokenMatch(haystack: string, token: string): boolean {
  if (token.length < 3) return haystack.split(' ').includes(token);
  return haystack.split(/\s+/).some((word) => word.startsWith(token));
}

export function searchPages(pages: readonly HynoePage[], query: string, filters: SearchFilters = {}): SearchResult[] {
  const normalized = normalizeQuery(query);
  const tokens = normalized.split(' ').filter(Boolean);
  const filtered = pages.filter((page) => {
    if (page.status !== 'published') return false;
    if (filters.pageType && page.pageType !== filters.pageType) return false;
    if (filters.category && !page.categories.some((c) => normalizeQuery(c) === normalizeQuery(filters.category!))) return false;
    return true;
  });
  // Neutral browse order. Hynoe ownership and featured flags never boost a result.
  if (!tokens.length) return filtered.map((page) => ({ page, score: 0, matchedFields: [] as string[] }))
    .sort((a, b) => a.page.name.localeCompare(b.page.name));

  const results: SearchResult[] = [];
  for (const page of filtered) {
    const name = normalizeQuery(page.name);
    const categories = page.categories.map(normalizeQuery);
    const tags = page.tags.map(normalizeQuery);
    const summary = normalizeQuery(`${page.summary} ${page.description}`);
    let score = 0;
    const matched = new Set<string>();
    if (name === normalized) { score += 100; matched.add('name'); }
    for (const token of tokens) {
      if (tokenMatch(name, token)) { score += 35; matched.add('name'); }
      if (categories.some((value) => tokenMatch(value, token))) { score += 20; matched.add('categories'); }
      if (tags.some((value) => tokenMatch(value, token))) { score += 16; matched.add('tags'); }
      if (tokenMatch(summary, token)) { score += 6; matched.add('description'); }
    }
    if (score > 0) results.push({ page, score, matchedFields: [...matched] });
  }
  return results.sort((a, b) => b.score - a.score || a.page.name.localeCompare(b.page.name));
}
