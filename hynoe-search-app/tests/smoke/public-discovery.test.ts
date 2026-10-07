import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('database-backed public discovery', () => {
  it('reads only published Hynoe Search Pages and protects flagship slugs', () => {
    const repository = source('src/lib/pages/public-pages.ts');
    expect(repository).toContain('HYNOE_SEARCH_TABLES.pages');
    expect(repository).toContain(".eq('publication_state', 'published')");
    expect(repository).toContain('flagshipSlugs');
  });

  it('feeds database Pages into Search', () => {
    const search = source('src/app/search/page.tsx');
    expect(search).toContain('listDiscoverablePages');
    expect(search).toContain('await listDiscoverablePages()');
  });

  it('resolves public Page routes from flagship or database discovery', () => {
    const route = source('src/app/p/[slug]/page.tsx');
    expect(route).toContain('getDiscoverablePageBySlug');
    expect(route).toContain('await getDiscoverablePageBySlug(slug)');
  });
});
