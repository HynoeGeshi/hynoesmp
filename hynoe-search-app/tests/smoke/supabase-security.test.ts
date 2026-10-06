import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = resolve(process.cwd(), 'supabase/migrations/20261006_phase2a_core.sql');

function migrationSql() {
  return readFileSync(migrationPath, 'utf8').toLowerCase();
}

describe('Phase 2A Supabase security contract', () => {
  it('enables RLS on every exposed user-owned table', () => {
    const sql = migrationSql();
    for (const table of ['profiles', 'pages', 'page_members', 'inquiries']) {
      expect(sql).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it('authorizes page writes from page_members and protects ownership on update', () => {
    const sql = migrationSql();
    expect(sql).toContain('page_members');
    expect(sql).toContain('auth.uid()');
    expect(sql).toMatch(/create policy[\s\S]*pages[\s\S]*for update[\s\S]*using[\s\S]*with check/);
  });

  it('does not grant direct anonymous inquiry inserts', () => {
    const sql = migrationSql();
    expect(sql).not.toMatch(/create policy[\s\S]*inquiries[\s\S]*for insert[\s\S]*to anon/);
    expect(sql).toContain('revoke insert on table public.inquiries from anon');
  });

  it('does not use user metadata as an authorization source', () => {
    const sql = migrationSql();
    expect(sql).not.toContain('user_metadata');
    expect(sql).not.toContain('raw_user_meta_data');
  });
});
