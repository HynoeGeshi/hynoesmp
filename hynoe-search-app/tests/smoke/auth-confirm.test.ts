import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifyOtp = vi.fn();
const exchangeCodeForSession = vi.fn();
const createServerSupabaseClient = vi.fn(async () => ({
  auth: { verifyOtp, exchangeCodeForSession },
}));

vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient }));

describe('confirmPasswordlessSignIn', () => {
  beforeEach(() => {
    verifyOtp.mockReset();
    exchangeCodeForSession.mockReset();
    createServerSupabaseClient.mockClear();
  });

  it('verifies an email token hash and returns the safe internal destination', async () => {
    verifyOtp.mockResolvedValue({ data: { session: {} }, error: null });
    const { confirmPasswordlessSignIn } = await import('@/lib/auth/confirm-passwordless');

    await expect(
      confirmPasswordlessSignIn({
        tokenHash: 'token-hash',
        type: 'email',
        code: null,
        returnPath: '/command-center/my-page?tab=services',
      }),
    ).resolves.toEqual({ ok: true, redirectPath: '/command-center/my-page?tab=services' });

    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: 'token-hash', type: 'email' });
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('exchanges a PKCE auth code when a token hash is not present', async () => {
    exchangeCodeForSession.mockResolvedValue({ data: { session: {} }, error: null });
    const { confirmPasswordlessSignIn } = await import('@/lib/auth/confirm-passwordless');

    await expect(
      confirmPasswordlessSignIn({
        tokenHash: null,
        type: null,
        code: 'auth-code',
        returnPath: '/command-center',
      }),
    ).resolves.toEqual({ ok: true, redirectPath: '/command-center' });

    expect(exchangeCodeForSession).toHaveBeenCalledWith('auth-code');
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it('sanitizes an external destination before completing sign-in', async () => {
    verifyOtp.mockResolvedValue({ data: { session: {} }, error: null });
    const { confirmPasswordlessSignIn } = await import('@/lib/auth/confirm-passwordless');

    const result = await confirmPasswordlessSignIn({
      tokenHash: 'token-hash',
      type: 'email',
      code: null,
      returnPath: 'https://evil.example/phish',
    });

    expect(result).toEqual({ ok: true, redirectPath: '/command-center' });
  });

  it('rejects unsupported OTP types without contacting Supabase', async () => {
    const { confirmPasswordlessSignIn } = await import('@/lib/auth/confirm-passwordless');

    await expect(
      confirmPasswordlessSignIn({
        tokenHash: 'token-hash',
        type: 'sms',
        code: null,
        returnPath: '/command-center',
      }),
    ).resolves.toEqual({ ok: false, redirectPath: '/sign-in?error=invalid-link' });

    expect(createServerSupabaseClient).not.toHaveBeenCalled();
  });

  it('returns a generic failure destination when Supabase rejects the confirmation', async () => {
    verifyOtp.mockResolvedValue({ data: { session: null }, error: new Error('expired token details') });
    const { confirmPasswordlessSignIn } = await import('@/lib/auth/confirm-passwordless');

    await expect(
      confirmPasswordlessSignIn({
        tokenHash: 'token-hash',
        type: 'email',
        code: null,
        returnPath: '/command-center',
      }),
    ).resolves.toEqual({ ok: false, redirectPath: '/sign-in?error=invalid-link' });
  });
});
