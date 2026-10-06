import { beforeEach, describe, expect, it, vi } from 'vitest';

const eq = vi.fn();
const update = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ update }));
const createServerSupabaseClient = vi.fn(async () => ({ from }));

vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient }));

describe('updateOwnedPage', () => {
  beforeEach(() => {
    eq.mockReset();
    update.mockClear();
    from.mockClear();
    createServerSupabaseClient.mockClear();
  });

  it('validates URLs before touching Supabase', async () => {
    const { updateOwnedPage } = await import('@/lib/pages/update-owned-page');

    await expect(updateOwnedPage('page-1', {
      summary: 'A useful summary',
      description: 'A useful description',
      canonicalUrl: 'javascript:alert(1)',
      locationText: 'Chicago, IL',
      serviceArea: 'Chicago area',
      categories: ['Creator'],
      tags: ['gaming'],
      primaryCtaLabel: 'Visit site',
      primaryCtaUrl: 'https://example.com',
      secondaryCtaLabel: '',
      secondaryCtaUrl: '',
      publicationState: 'draft',
    })).resolves.toEqual({ ok: false, error: 'invalid-page' });

    expect(createServerSupabaseClient).not.toHaveBeenCalled();
  });

  it('updates only validated structured fields through the session-scoped client', async () => {
    eq.mockResolvedValue({ data: null, error: null });
    const { updateOwnedPage } = await import('@/lib/pages/update-owned-page');

    await expect(updateOwnedPage('page-1', {
      summary: '  Hynoe Studio helps gaming creators grow.  ',
      description: '  Full creator operations, content systems, and discovery support.  ',
      canonicalUrl: 'https://example.com',
      locationText: 'Chicago, IL',
      serviceArea: 'Worldwide online',
      categories: [' Creator ', 'Gaming'],
      tags: [' streaming ', 'Gaming', 'streaming'],
      primaryCtaLabel: ' Work with us ',
      primaryCtaUrl: 'https://example.com/contact',
      secondaryCtaLabel: '',
      secondaryCtaUrl: '',
      publicationState: 'draft',
    })).resolves.toEqual({ ok: true });

    expect(from).toHaveBeenCalledWith('pages');
    expect(update).toHaveBeenCalledWith({
      summary: 'Hynoe Studio helps gaming creators grow.',
      description: 'Full creator operations, content systems, and discovery support.',
      canonical_url: 'https://example.com',
      location_text: 'Chicago, IL',
      service_area: 'Worldwide online',
      categories: ['Creator', 'Gaming'],
      tags: ['streaming', 'Gaming'],
      primary_cta_label: 'Work with us',
      primary_cta_url: 'https://example.com/contact',
      secondary_cta_label: null,
      secondary_cta_url: null,
      publication_state: 'draft',
      updated_at: expect.any(String),
    });
    expect(eq).toHaveBeenCalledWith('id', 'page-1');
  });

  it('returns a generic failure when RLS or the database rejects the update', async () => {
    eq.mockResolvedValue({ data: null, error: new Error('rls private details') });
    const { updateOwnedPage } = await import('@/lib/pages/update-owned-page');

    await expect(updateOwnedPage('page-1', {
      summary: '',
      description: '',
      canonicalUrl: '',
      locationText: '',
      serviceArea: '',
      categories: [],
      tags: [],
      primaryCtaLabel: '',
      primaryCtaUrl: '',
      secondaryCtaLabel: '',
      secondaryCtaUrl: '',
      publicationState: 'draft',
    })).resolves.toEqual({ ok: false, error: 'update-failed' });
  });
});
