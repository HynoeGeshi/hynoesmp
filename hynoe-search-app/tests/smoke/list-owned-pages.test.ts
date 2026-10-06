import { beforeEach, describe, expect, it, vi } from 'vitest';

const eq = vi.fn();
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));
const createServerSupabaseClient = vi.fn(async () => ({ from }));

vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient }));

describe('listOwnedPages', () => {
  beforeEach(() => {
    eq.mockReset();
    select.mockClear();
    from.mockClear();
    createServerSupabaseClient.mockClear();
  });

  it('reads only memberships belonging to the authenticated user', async () => {
    eq.mockResolvedValue({
      data: [
        {
          role: 'owner',
          pages: {
            id: 'page-1',
            slug: 'hynoe-studio',
            name: 'Hynoe Studio',
            page_type: 'creator',
            publication_state: 'draft',
            summary: '',
            description: '',
            canonical_url: null,
            location_text: null,
            service_area: null,
            categories: [],
            tags: [],
            modules: [],
            primary_cta_label: null,
            primary_cta_url: null,
            secondary_cta_label: null,
            secondary_cta_url: null,
          },
        },
      ],
      error: null,
    });
    const { listOwnedPages } = await import('@/lib/pages/list-owned-pages');

    await expect(listOwnedPages('user-1')).resolves.toEqual([
      expect.objectContaining({
        id: 'page-1',
        slug: 'hynoe-studio',
        name: 'Hynoe Studio',
        pageType: 'creator',
        publicationState: 'draft',
        role: 'owner',
      }),
    ]);

    expect(from).toHaveBeenCalledWith('page_members');
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('returns an empty list when the membership query fails', async () => {
    eq.mockResolvedValue({ data: null, error: new Error('database unavailable') });
    const { listOwnedPages } = await import('@/lib/pages/list-owned-pages');

    await expect(listOwnedPages('user-1')).resolves.toEqual([]);
  });
});
