import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Command Center ownership surface', () => {
  it('loads owned or managed pages through the isolated Hynoe Search server data layer', () => {
    const data = source('src/lib/pages/owned-pages.ts');
    expect(data).toContain('HYNOE_SEARCH_TABLES.pageMembers');
    expect(data).toContain('HYNOE_SEARCH_TABLES.pages');
    expect(data).toContain('created_by');
    expect(data).toContain('categories');
    expect(data).toContain('tags');
  });

  it('renders private Pages with discovery readiness', () => {
    const page = source('src/app/command-center/page.tsx');
    expect(page).toContain('Your Hynoe Pages');
    expect(page).toContain('getOwnedPages');
    expect(page).toContain('publication_state');
    expect(page).toContain('scorePageHealth');
    expect(page).toContain('Page Health');
  });
});
