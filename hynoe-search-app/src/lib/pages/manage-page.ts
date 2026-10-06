import { createClient } from '@/lib/supabase/server';

export type ManagedPage = {
  id: string;
  created_by: string;
  slug: string;
  name: string;
  page_type: string;
  publication_state: 'draft' | 'published';
  summary: string;
  description: string;
  canonical_url: string | null;
  location_label: string | null;
  service_area: string | null;
};

export async function getManagedPage(pageId: string, userId: string): Promise<ManagedPage | null> {
  const supabase = await createClient();
  const { data: page, error } = await supabase
    .from('pages')
    .select('id, created_by, slug, name, page_type, publication_state, summary, description, canonical_url, location_label, service_area')
    .eq('id', pageId)
    .maybeSingle();

  if (error || !page) return null;
  if (page.created_by === userId) return page as ManagedPage;

  const { data: membership } = await supabase
    .from('page_members')
    .select('role')
    .eq('page_id', pageId)
    .eq('user_id', userId)
    .maybeSingle();

  return membership ? (page as ManagedPage) : null;
}
