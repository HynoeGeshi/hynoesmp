import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
function source(path: string) { return readFileSync(resolve(process.cwd(), path), 'utf8'); }

describe('database-backed public discovery', () => {
  it('reads only published Pages and protects both flagship and unclaimed curated slugs', () => {
    const repository = source('src/lib/pages/public-pages.ts');
    expect(repository).toContain('HYNOE_SEARCH_TABLES.pages');
    expect(repository).toContain(".eq('publication_state', 'published')");
    expect(repository).toContain('const curatedPages = [...flagshipPages, ...publicBusinessPages]');
    expect(repository).toContain('const curatedSlugs = new Set(curatedPages.map((page) => page.slug))');
    expect(repository).toContain('!curatedSlugs.has(page.slug)');
  });
  it('feeds database Pages into Search', () => {
    const search = source('src/app/search/page.tsx');
    expect(search).toContain('listDiscoverablePages');
    expect(search).toContain('await listDiscoverablePages()');
  });
  it('resolves public Page routes from curated or database discovery', () => {
    const route = source('src/app/p/[slug]/page.tsx');
    expect(route).toContain('getDiscoverablePageBySlug');
    expect(route).toContain('await getDiscoverablePageBySlug(slug)');
    expect(route).toContain("export const dynamic = 'force-dynamic'");
  });
});
