import { beforeEach, describe, expect, it, vi } from 'vitest';

const confirmPasswordlessSignIn = vi.fn();

vi.mock('@/lib/auth/confirm-passwordless', () => ({ confirmPasswordlessSignIn }));

describe('GET /auth/confirm', () => {
  beforeEach(() => confirmPasswordlessSignIn.mockReset());

  it('passes confirmation parameters to the auth helper and redirects to the safe result', async () => {
    confirmPasswordlessSignIn.mockResolvedValue({ ok: true, redirectPath: '/command-center/my-page' });
    const { GET } = await import('@/app/auth/confirm/route');

    const response = await GET(
      new Request('https://hynoe.net/auth/confirm?token_hash=abc123&type=email&next=%2Fcommand-center%2Fmy-page'),
    );

    expect(confirmPasswordlessSignIn).toHaveBeenCalledWith({
      tokenHash: 'abc123',
      type: 'email',
      code: null,
      returnPath: '/command-center/my-page',
    });
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://hynoe.net/command-center/my-page');
  });

  it('supports PKCE auth-code confirmation links', async () => {
    confirmPasswordlessSignIn.mockResolvedValue({ ok: true, redirectPath: '/command-center' });
    const { GET } = await import('@/app/auth/confirm/route');

    const response = await GET(new Request('https://hynoe.net/auth/confirm?code=pkce-code'));

    expect(confirmPasswordlessSignIn).toHaveBeenCalledWith({
      tokenHash: null,
      type: null,
      code: 'pkce-code',
      returnPath: null,
    });
    expect(response.headers.get('location')).toBe('https://hynoe.net/command-center');
  });

  it('uses the generic sign-in error destination returned by the helper', async () => {
    confirmPasswordlessSignIn.mockResolvedValue({ ok: false, redirectPath: '/sign-in?error=invalid-link' });
    const { GET } = await import('@/app/auth/confirm/route');

    const response = await GET(new Request('https://hynoe.net/auth/confirm?token_hash=bad&type=email'));

    expect(response.headers.get('location')).toBe('https://hynoe.net/sign-in?error=invalid-link');
  });
});
