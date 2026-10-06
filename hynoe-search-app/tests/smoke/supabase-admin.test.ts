import { afterEach, describe, expect, it, vi } from 'vitest';

const createClient = vi.fn(() => ({ from: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient }));

describe('server-only Supabase admin client', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    createClient.mockClear();
    vi.resetModules();
  });

  it('requires a server-only secret key and never falls back to a public key', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_public');
    vi.stubEnv('SUPABASE_SECRET_KEY', '');

    const { createAdminSupabaseClient } = await import('@/lib/supabase/admin');

    expect(() => createAdminSupabaseClient()).toThrow('SUPABASE_SECRET_KEY');
    expect(createClient).not.toHaveBeenCalled();
  });

  it('creates a non-persistent backend client with the secret key', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_backend_only');

    const { createAdminSupabaseClient } = await import('@/lib/supabase/admin');
    createAdminSupabaseClient();

    expect(createClient).toHaveBeenCalledWith(
      'https://project.supabase.co',
      'sb_secret_backend_only',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
  });
});
