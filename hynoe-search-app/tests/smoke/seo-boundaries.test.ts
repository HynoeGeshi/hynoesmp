import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Hynoe crawl and indexing boundaries', () => {
  it('keeps private and authentication routes out of crawler access', () => {
    const robots = source('src/app/robots.ts');
    expect(robots).toContain('/command-center');
    expect(robots).toContain('/sign-in');
    expect(robots).toContain('/auth/');
  });

  it('keeps internal search out of the sitemap while including every discoverable Page', () => {
    const sitemap = source('src/app/sitemap.ts');
    expect(sitemap).toContain('listDiscoverablePages');
    expect(sitemap).not.toContain("url: 'https://hynoe.net/search'");
    expect(sitemap).toContain('page.slug');
  });

  it('marks sign-in and internal search as noindex surfaces', () => {
    const signIn = source('src/app/sign-in/page.tsx');
    const search = source('src/app/search/page.tsx');

    expect(signIn).toContain('index: false');
    expect(signIn).toContain('follow: false');
    expect(search).toContain('generateMetadata');
    expect(search).toContain('index: false');
  });
});
