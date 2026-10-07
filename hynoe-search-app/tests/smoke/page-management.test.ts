import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Phase 2A page management and inquiry boundary', () => {
  it('creates pages under the authenticated user in isolated Hynoe Search tables', () => {
    const action = source('src/app/command-center/pages/new/actions.ts');
    expect(action).toContain('requireUser');
    expect(action).toContain('HYNOE_SEARCH_TABLES.pages');
    expect(action).toContain('HYNOE_SEARCH_TABLES.pageMembers');
    expect(action).toContain("role: 'owner'");
  });

  it('re-checks management rights before showing or updating a page', () => {
    const manage = source('src/lib/pages/manage-page.ts');
    expect(manage).toContain('HYNOE_SEARCH_TABLES.pageMembers');
    expect(manage).toContain('created_by');
  });

  it('accepts public inquiries through the validated Edge Function boundary without a service key in Render', () => {
    const route = source('src/app/api/inquiries/route.ts');
    expect(route).toContain('/functions/v1/submit-hynoe-inquiry');
    expect(route).toContain('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
    expect(route).not.toContain('SUPABASE_SECRET_KEY');
    expect(route).not.toContain('createAdminClient');
  });
});
