import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireUser = vi.fn(async () => ({ id: 'user-1', email: 'owner@example.com' }));
const createOwnedPage = vi.fn();

vi.mock('@/lib/auth/require-user', () => ({ requireUser }));
vi.mock('@/lib/pages/create-owned-page', () => ({ createOwnedPage }));

describe('POST /command-center/my-page/create', () => {
  beforeEach(() => {
    requireUser.mockClear();
    createOwnedPage.mockReset();
  });

  it('creates the Page for the authenticated user and redirects back with 303', async () => {
    createOwnedPage.mockResolvedValue({ ok: true, pageId: 'page-1', slug: 'hynoe-studio' });
    const { POST } = await import('@/app/command-center/my-page/create/route');
    const body = new URLSearchParams({
      name: 'Hynoe Studio',
      slug: 'hynoe-studio',
      pageType: 'creator',
      userId: 'attacker-controlled',
    }).toString();

    const response = await POST(new Request('https://hynoe.net/command-center/my-page/create', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    }));

    expect(requireUser).toHaveBeenCalledWith('/command-center/my-page');
    expect(createOwnedPage).toHaveBeenCalledWith('user-1', {
      name: 'Hynoe Studio',
      slug: 'hynoe-studio',
      pageType: 'creator',
    });
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://hynoe.net/command-center/my-page');
  });

  it('returns only a generic error code when validation or creation fails', async () => {
    createOwnedPage.mockResolvedValue({ ok: false, error: 'create-failed' });
    const { POST } = await import('@/app/command-center/my-page/create/route');
    const body = new URLSearchParams({
      name: 'Hynoe Studio',
      slug: 'hynoe-studio',
      pageType: 'creator',
    }).toString();

    const response = await POST(new Request('https://hynoe.net/command-center/my-page/create', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    }));

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://hynoe.net/command-center/my-page?error=create-failed');
  });
});
