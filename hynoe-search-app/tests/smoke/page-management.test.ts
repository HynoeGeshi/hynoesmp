import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Phase 2A page management and inquiry boundary', () => {
  it('creates pages under the authenticated user and adds an owner membership', () => {
    const action = source('src/app/command-center/pages/new/actions.ts');
    expect(action).toContain('requireUser');
    expect(action).toContain("from('pages')");
    expect(action).toContain("from('page_members')");
    expect(action).toContain("role: 'owner'");
  });

  it('re-checks management rights before showing or updating a page', () => {
    const manage = source('src/lib/pages/manage-page.ts');
    expect(manage).toContain("from('page_members')");
    expect(manage).toContain('created_by');
  });

  it('accepts public inquiries only through a server secret boundary', () => {
    const admin = source('src/lib/supabase/admin.ts');
    const route = source('src/app/api/inquiries/route.ts');
    expect(admin).toContain('SUPABASE_SECRET_KEY');
    expect(route).toContain('createAdminClient');
    expect(route).toContain("publication_state");
    expect(route).toContain("from('inquiries')");
  });
});
