import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createBrowserClient = vi.fn(() => ({ runtime: 'browser' }));
const createServerClient = vi.fn(() => ({ runtime: 'server' }));
const cookieSet = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createBrowserClient,
  createServerClient,
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [{ name: 'session', value: 'cookie-value' }],
    set: cookieSet,
  })),
}));

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

beforeEach(() => {
  createBrowserClient.mockClear();
  createServerClient.mockClear();
  cookieSet.mockClear();
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_example';
});

afterEach(() => {
  if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;

  if (originalKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
});

describe('Supabase SSR client boundaries', () => {
  it('creates the browser client with only public project credentials', async () => {
    const { createBrowserSupabaseClient } = await import('@/lib/supabase/client');

    expect(createBrowserSupabaseClient()).toEqual({ runtime: 'browser' });
    expect(createBrowserClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'sb_publishable_example',
    );
  });

  it('creates a cookie-backed server client using the public project credentials', async () => {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');

    expect(await createServerSupabaseClient()).toEqual({ runtime: 'server' });
    expect(createServerClient).toHaveBeenCalledTimes(1);

    const [url, key, options] = createServerClient.mock.calls[0];
    expect(url).toBe('https://example.supabase.co');
    expect(key).toBe('sb_publishable_example');
    expect(options.cookies.getAll()).toEqual([
      { name: 'session', value: 'cookie-value' },
    ]);

    options.cookies.setAll([{ name: 'refreshed', value: 'token', options: { path: '/' } }]);
    expect(cookieSet).toHaveBeenCalledWith('refreshed', 'token', { path: '/' });
  });
});
