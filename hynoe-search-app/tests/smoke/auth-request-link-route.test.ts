import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestPasswordlessSignIn = vi.fn();

vi.mock('@/lib/auth/passwordless', () => ({ requestPasswordlessSignIn }));

describe('POST /auth/request-link', () => {
  beforeEach(() => requestPasswordlessSignIn.mockReset());

  it('requests a passwordless link and redirects with 303 to a non-sensitive success state', async () => {
    requestPasswordlessSignIn.mockResolvedValue({
      ok: true,
      message: 'Check your email for your secure Hynoe sign-in link.',
    });
    const { POST } = await import('@/app/auth/request-link/route');
    const body = new URLSearchParams({ email: ' User@Example.COM ', next: '/command-center' });

    const response = await POST(
      new Request('https://hynoe.net/auth/request-link', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
      }),
    );

    expect(requestPasswordlessSignIn).toHaveBeenCalledWith({
      email: ' User@Example.COM ',
      returnPath: '/command-center',
      origin: 'https://hynoe.net',
    });
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://hynoe.net/sign-in?sent=1&next=%2Fcommand-center');
  });

  it('sanitizes an external next value before using it in the response', async () => {
    requestPasswordlessSignIn.mockResolvedValue({ ok: true, message: 'sent' });
    const { POST } = await import('@/app/auth/request-link/route');
    const body = new URLSearchParams({ email: 'user@example.com', next: 'https://evil.example/phish' });

    const response = await POST(
      new Request('https://hynoe.net/auth/request-link', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
      }),
    );

    expect(requestPasswordlessSignIn).toHaveBeenCalledWith({
      email: 'user@example.com',
      returnPath: '/command-center',
      origin: 'https://hynoe.net',
    });
    expect(response.headers.get('location')).toBe('https://hynoe.net/sign-in?sent=1&next=%2Fcommand-center');
  });

  it('returns only a generic error code when the provider request fails', async () => {
    requestPasswordlessSignIn.mockResolvedValue({ ok: false, message: 'private provider details' });
    const { POST } = await import('@/app/auth/request-link/route');
    const body = new URLSearchParams({ email: 'user@example.com', next: '/command-center' });

    const response = await POST(
      new Request('https://hynoe.net/auth/request-link', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://hynoe.net/sign-in?error=send-failed&next=%2Fcommand-center');
    expect(response.headers.get('location')).not.toContain('private');
  });
});
