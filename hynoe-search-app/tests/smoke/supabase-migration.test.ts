import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20261006220000_phase_2a_owned_pages.sql',
);

function migrationSql() {
  return readFileSync(migrationPath, 'utf8').toLowerCase();
}

describe('Phase 2A Supabase migration', () => {
  it('creates the core ownership and inquiry tables', () => {
    const sql = migrationSql();
    for (const table of ['profiles', 'pages', 'page_members', 'inquiries']) {
      expect(sql).toContain(`create table public.${table}`);
    }
  });

  it('enables row level security on every exposed user-owned table', () => {
    const sql = migrationSql();
    for (const table of ['profiles', 'pages', 'page_members', 'inquiries']) {
      expect(sql).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it('uses page membership and explicit update checks for authorization', () => {
    const sql = migrationSql();
    expect(sql).toContain('public.page_members');
    expect(sql).toContain('auth.uid()');
    expect(sql).toContain('with check');
    expect(sql).not.toContain('user_metadata');
    expect(sql).not.toContain('auth.role()');
  });

  it('limits anonymous page reads to published pages', () => {
    const sql = migrationSql();
    expect(sql).toContain("publication_state = 'published'");
    expect(sql).toContain('to anon');
  });

  it('does not grant anonymous users direct insert access to inquiries', () => {
    const sql = migrationSql();
    expect(sql).not.toMatch(/create policy[^;]*inquiries[^;]*for insert[^;]*to anon/s);
    expect(sql).not.toMatch(/grant insert on public\.inquiries to anon/);
  });
});
