import { beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithOtp = vi.fn();
const createServerSupabaseClient = vi.fn(async () => ({
  auth: { signInWithOtp },
}));

vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient }));

describe('requestPasswordlessSignIn', () => {
  beforeEach(() => {
    signInWithOtp.mockReset();
    createServerSupabaseClient.mockClear();
  });

  it('normalizes email and requests a magic link with a safe internal return path', async () => {
    signInWithOtp.mockResolvedValue({ data: { user: null, session: null }, error: null });

    const { requestPasswordlessSignIn } = await import('@/lib/auth/passwordless');
    const result = await requestPasswordlessSignIn({
      email: '  Owner@Example.COM  ',
      returnPath: '/command-center/my-page?tab=services',
      origin: 'https://hynoe.net',
    });

    expect(result).toEqual({
      ok: true,
      message: 'Check your email for your secure Hynoe sign-in link.',
    });
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'owner@example.com',
      options: {
        shouldCreateUser: true,
        emailRedirectTo:
          'https://hynoe.net/auth/confirm?next=%2Fcommand-center%2Fmy-page%3Ftab%3Dservices',
      },
    });
  });

  it('rejects invalid email without contacting Supabase', async () => {
    const { requestPasswordlessSignIn } = await import('@/lib/auth/passwordless');

    await expect(
      requestPasswordlessSignIn({
        email: 'not-an-email',
        returnPath: '/command-center',
        origin: 'https://hynoe.net',
      }),
    ).resolves.toEqual({
      ok: false,
      message: 'Enter a valid email address.',
    });
    expect(createServerSupabaseClient).not.toHaveBeenCalled();
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it('sanitizes an external return path before requesting the link', async () => {
    signInWithOtp.mockResolvedValue({ data: { user: null, session: null }, error: null });
    const { requestPasswordlessSignIn } = await import('@/lib/auth/passwordless');

    await requestPasswordlessSignIn({
      email: 'owner@example.com',
      returnPath: 'https://evil.example/phish',
      origin: 'https://hynoe.net',
    });

    expect(signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          emailRedirectTo: 'https://hynoe.net/auth/confirm?next=%2Fcommand-center',
        }),
      }),
    );
  });

  it('returns a generic error message without leaking provider details', async () => {
    signInWithOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: new Error('provider says user missing'),
    });
    const { requestPasswordlessSignIn } = await import('@/lib/auth/passwordless');

    await expect(
      requestPasswordlessSignIn({
        email: 'owner@example.com',
        returnPath: '/command-center',
        origin: 'https://hynoe.net',
      }),
    ).resolves.toEqual({
      ok: false,
      message: 'We could not send a sign-in link. Try again in a moment.',
    });
  });
});
