import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Supabase SSR auth foundation', () => {
  it('keeps browser auth on publishable credentials only', () => {
    const browser = source('src/lib/supabase/client.ts');
    expect(browser).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(browser).toContain('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
    expect(browser).not.toMatch(/service[_-]?role/i);
    expect(browser).not.toMatch(/SUPABASE_SECRET/i);
  });

  it('validates the authenticated user on the server', () => {
    const auth = source('src/lib/auth/require-user.ts');
    expect(auth).toContain('auth.getUser()');
    expect(auth).toContain("redirect('/sign-in')");
  });

  it('uses a safe same-origin next path in the auth callback', () => {
    const callback = source('src/app/auth/callback/route.ts');
    expect(callback).toContain('exchangeCodeForSession');
    expect(callback).toContain('safeNextPath');
    expect(callback).not.toContain('new URL(next,');
  });

  it('does not cache private command center routes', () => {
    const layout = source('src/app/command-center/layout.tsx');
    expect(layout).toContain("export const dynamic = 'force-dynamic'");
    expect(layout).toContain('requireUser');
  });
});
