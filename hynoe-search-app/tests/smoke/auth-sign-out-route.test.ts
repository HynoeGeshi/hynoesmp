import { describe, expect, it, vi } from 'vitest';

const signOut = vi.fn();
const createServerSupabaseClient = vi.fn(async () => ({ auth: { signOut } }));

vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient }));

describe('POST /auth/sign-out', () => {
  it('signs out the current session and redirects home with 303', async () => {
    signOut.mockResolvedValue({ error: null });
    const { POST } = await import('@/app/auth/sign-out/route');

    const response = await POST(new Request('https://hynoe.net/auth/sign-out', { method: 'POST' }));

    expect(createServerSupabaseClient).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://hynoe.net/');
  });

  it('does not expose provider errors and still returns to Hynoe', async () => {
    signOut.mockResolvedValue({ error: new Error('private provider detail') });
    const { POST } = await import('@/app/auth/sign-out/route');

    const response = await POST(new Request('https://hynoe.net/auth/sign-out', { method: 'POST' }));

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://hynoe.net/');
    expect(response.headers.get('location')).not.toContain('provider');
  });
});
