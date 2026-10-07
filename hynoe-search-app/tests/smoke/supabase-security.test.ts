import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = resolve(process.cwd(), 'supabase/migrations/20261007_shared_project_bridge.sql');

function migrationSql() {
  return readFileSync(migrationPath, 'utf8').toLowerCase();
}

describe('Phase 2A shared-project Supabase security contract', () => {
  it('enables RLS on every Hynoe Search user-owned table', () => {
    const sql = migrationSql();
    for (const table of ['hynoe_search_profiles', 'hynoe_search_pages', 'hynoe_search_page_members', 'hynoe_search_inquiries']) {
      expect(sql).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it('authorizes page writes through creator or membership checks and protects ownership on update', () => {
    const sql = migrationSql();
    expect(sql).toContain('hynoe_search_page_members');
    expect(sql).toContain('auth.uid()');
    expect(sql).toContain('hynoe_search_has_page_role');
    expect(sql).toMatch(/create policy "hynoe_search_pages_update"[\s\S]*for update[\s\S]*using[\s\S]*with check/);
  });

  it('does not grant direct anonymous inquiry inserts', () => {
    const sql = migrationSql();
    expect(sql).not.toMatch(/create policy[\s\S]*hynoe_search_inquiries[\s\S]*for insert[\s\S]*to anon/);
    expect(sql).not.toContain('grant insert on table public.hynoe_search_inquiries to anon');
  });

  it('does not use user metadata as an authorization source', () => {
    const sql = migrationSql();
    expect(sql).not.toContain('user_metadata');
    expect(sql).not.toContain('raw_user_meta_data');
  });
});
