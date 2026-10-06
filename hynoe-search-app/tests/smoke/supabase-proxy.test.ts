import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Next 16 Supabase auth proxy', () => {
  it('refreshes auth claims through a cookie-backed Supabase server client', () => {
    const updateSession = source('src/lib/supabase/proxy.ts');

    expect(updateSession).toContain('createServerClient');
    expect(updateSession).toContain('request.cookies.getAll()');
    expect(updateSession).toContain('supabase.auth.getClaims()');
    expect(updateSession).toContain('supabaseResponse.cookies.set');
    expect(updateSession).not.toContain('service_role');
    expect(updateSession).not.toContain('getSession()');
  });

  it('uses the Next 16 proxy entrypoint and skips static asset traffic', () => {
    const proxy = source('src/proxy.ts');

    expect(proxy).toContain('export async function proxy');
    expect(proxy).toContain('updateSupabaseSession');
    expect(proxy).toContain('_next/static');
    expect(proxy).toContain('_next/image');
    expect(proxy).toContain('favicon.ico');
  });

  it('keeps public Hynoe routes available before Supabase is configured', () => {
    const proxy = source('src/proxy.ts');

    expect(proxy).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(proxy).toContain('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
    expect(proxy).toContain('NextResponse.next');
  });
});
