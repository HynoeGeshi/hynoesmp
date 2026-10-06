import { beforeEach, describe, expect, it, vi } from 'vitest';

const pageSingle = vi.fn();
const pageSelect = vi.fn(() => ({ single: pageSingle }));
const pageInsert = vi.fn(() => ({ select: pageSelect }));
const pageDeleteEq = vi.fn();
const pageDelete = vi.fn(() => ({ eq: pageDeleteEq }));
const memberInsert = vi.fn();
const from = vi.fn((table: string) => {
  if (table === 'pages') return { insert: pageInsert, delete: pageDelete };
  if (table === 'page_members') return { insert: memberInsert };
  throw new Error(`unexpected table ${table}`);
});
const createAdminSupabaseClient = vi.fn(() => ({ from }));

vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient }));

describe('createOwnedPage', () => {
  beforeEach(() => {
    from.mockClear();
    pageInsert.mockClear();
    pageSelect.mockClear();
    pageSingle.mockReset();
    pageDelete.mockClear();
    pageDeleteEq.mockReset();
    memberInsert.mockReset();
    createAdminSupabaseClient.mockClear();
  });

  it('rejects invalid page input before opening the privileged client', async () => {
    const { createOwnedPage } = await import('@/lib/pages/create-owned-page');

    await expect(
      createOwnedPage('user-1', {
        name: '   ',
        slug: 'Bad Slug!',
        pageType: 'creator',
      }),
    ).resolves.toEqual({ ok: false, error: 'invalid-page' });

    expect(createAdminSupabaseClient).not.toHaveBeenCalled();
  });

  it('creates a draft page and makes the authenticated creator its owner', async () => {
    pageSingle.mockResolvedValue({ data: { id: 'page-1', slug: 'hynoe-studio' }, error: null });
    memberInsert.mockResolvedValue({ error: null });
    const { createOwnedPage } = await import('@/lib/pages/create-owned-page');

    await expect(
      createOwnedPage('user-1', {
        name: 'Hynoe Studio',
        slug: 'hynoe-studio',
        pageType: 'creator',
      }),
    ).resolves.toEqual({ ok: true, pageId: 'page-1', slug: 'hynoe-studio' });

    expect(pageInsert).toHaveBeenCalledWith({
      name: 'Hynoe Studio',
      slug: 'hynoe-studio',
      page_type: 'creator',
      publication_state: 'draft',
      created_by: 'user-1',
    });
    expect(pageSelect).toHaveBeenCalledWith('id, slug');
    expect(memberInsert).toHaveBeenCalledWith({
      page_id: 'page-1',
      user_id: 'user-1',
      role: 'owner',
    });
  });

  it('removes the created page if owner membership creation fails', async () => {
    pageSingle.mockResolvedValue({ data: { id: 'page-1', slug: 'hynoe-studio' }, error: null });
    memberInsert.mockResolvedValue({ error: new Error('membership failed') });
    pageDeleteEq.mockResolvedValue({ error: null });
    const { createOwnedPage } = await import('@/lib/pages/create-owned-page');

    await expect(
      createOwnedPage('user-1', {
        name: 'Hynoe Studio',
        slug: 'hynoe-studio',
        pageType: 'creator',
      }),
    ).resolves.toEqual({ ok: false, error: 'create-failed' });

    expect(pageDelete).toHaveBeenCalledTimes(1);
    expect(pageDeleteEq).toHaveBeenCalledWith('id', 'page-1');
  });
});
