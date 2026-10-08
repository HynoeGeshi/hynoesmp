import type { HynoePage } from './types';

/** Published content only. Selection is editorial, never a popularity score. */
export function selectPublicDiscovery(pages: readonly HynoePage[]) {
  const seen = new Set<string>();
  const published = pages.filter((page) => {
    if (page.status !== 'published' || !page.name.trim()) return false;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.slug) || seen.has(page.slug)) return false;
    seen.add(page.slug);
    return true;
  });

  return {
    featured: published.filter((page) => page.featured === true).slice(0, 3),
    community: published.filter((page) => page.featured !== true).slice(0, 6),
  };
}
