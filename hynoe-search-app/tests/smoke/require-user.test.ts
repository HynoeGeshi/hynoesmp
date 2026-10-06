import { beforeEach, describe, expect, it, vi } from 'vitest';

const getClaims = vi.fn();
const createServerSupabaseClient = vi.fn(async () => ({
  auth: { getClaims },
}));
const redirect = vi.fn((target: string) => {
  throw new Error(`REDIRECT:${target}`);
});

vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient }));
vi.mock('next/navigation', () => ({ redirect }));

describe('requireUser', () => {
  beforeEach(() => {
    getClaims.mockReset();
    createServerSupabaseClient.mockClear();
    redirect.mockClear();
  });

  it('returns identity from verified claims', async () => {
    getClaims.mockResolvedValue({
      data: {
        claims: {
          sub: 'user-123',
          email: 'owner@example.com',
        },
      },
      error: null,
    });

    const { requireUser } = await import('@/lib/auth/require-user');

    await expect(requireUser('/command-center')).resolves.toEqual({
      id: 'user-123',
      email: 'owner@example.com',
    });
    expect(createServerSupabaseClient).toHaveBeenCalledTimes(1);
    expect(getClaims).toHaveBeenCalledTimes(1);
  });

  it('redirects unauthenticated requests to sign in with a safe return path', async () => {
    getClaims.mockResolvedValue({ data: { claims: null }, error: new Error('no session') });

    const { requireUser } = await import('@/lib/auth/require-user');

    await expect(requireUser('/command-center/my-page?tab=services')).rejects.toThrow(
      'REDIRECT:/sign-in?next=%2Fcommand-center%2Fmy-page%3Ftab%3Dservices',
    );
  });

  it('sanitizes external return paths before redirecting', async () => {
    getClaims.mockResolvedValue({ data: { claims: null }, error: new Error('no session') });

    const { requireUser } = await import('@/lib/auth/require-user');

    await expect(requireUser('https://evil.example')).rejects.toThrow(
      'REDIRECT:/sign-in?next=%2Fcommand-center',
    );
  });
});
