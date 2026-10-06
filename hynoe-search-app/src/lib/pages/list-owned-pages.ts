import type { HynoePageType, PageModule } from '@/domain/pages/types';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export type OwnedPage = {
  id: string;
  slug: string;
  name: string;
  pageType: HynoePageType;
  publicationState: 'draft' | 'published';
  summary: string;
  description: string;
  canonicalUrl: string | null;
  locationText: string | null;
  serviceArea: string | null;
  categories: string[];
  tags: string[];
  modules: PageModule[];
  primaryCtaLabel: string | null;
  primaryCtaUrl: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaUrl: string | null;
  role: 'owner' | 'manager' | 'editor' | 'operator';
};

type MembershipRow = {
  role: OwnedPage['role'];
  pages: Record<string, unknown> | Array<Record<string, unknown>> | null;
};

export async function listOwnedPages(userId: string): Promise<OwnedPage[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('page_members')
    .select(
      'role, pages(id, slug, name, page_type, publication_state, summary, description, canonical_url, location_text, service_area, categories, tags, modules, primary_cta_label, primary_cta_url, secondary_cta_label, secondary_cta_url)',
    )
    .eq('user_id', userId);

  if (error || !data) return [];

  return (data as unknown as MembershipRow[]).flatMap((membership) => {
    const related = Array.isArray(membership.pages) ? membership.pages[0] : membership.pages;
    if (!related) return [];

    return [
      {
        id: String(related.id),
        slug: String(related.slug),
        name: String(related.name),
        pageType: related.page_type as HynoePageType,
        publicationState: related.publication_state as 'draft' | 'published',
        summary: typeof related.summary === 'string' ? related.summary : '',
        description: typeof related.description === 'string' ? related.description : '',
        canonicalUrl: typeof related.canonical_url === 'string' ? related.canonical_url : null,
        locationText: typeof related.location_text === 'string' ? related.location_text : null,
        serviceArea: typeof related.service_area === 'string' ? related.service_area : null,
        categories: Array.isArray(related.categories) ? (related.categories as string[]) : [],
        tags: Array.isArray(related.tags) ? (related.tags as string[]) : [],
        modules: Array.isArray(related.modules) ? (related.modules as PageModule[]) : [],
        primaryCtaLabel: typeof related.primary_cta_label === 'string' ? related.primary_cta_label : null,
        primaryCtaUrl: typeof related.primary_cta_url === 'string' ? related.primary_cta_url : null,
        secondaryCtaLabel: typeof related.secondary_cta_label === 'string' ? related.secondary_cta_label : null,
        secondaryCtaUrl: typeof related.secondary_cta_url === 'string' ? related.secondary_cta_url : null,
        role: membership.role,
      },
    ];
  });
}
