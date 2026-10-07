import { createClient } from '@/lib/supabase/server';
import { HYNOE_SEARCH_TABLES } from '@/lib/supabase/table-names';

export type OwnedPage = {
  id: string;
  slug: string;
  name: string;
  page_type: string;
  publication_state: 'draft' | 'published';
  summary: string;
  description: string;
  canonical_url: string | null;
  location_label: string | null;
  service_area: string | null;
  categories: string[];
  tags: string[];
  updated_at: string;
};

export async function getOwnedPages(userId: string): Promise<OwnedPage[]> {
  const supabase = await createClient();
  const { data: memberships, error: membershipError } = await supabase
    .from(HYNOE_SEARCH_TABLES.pageMembers)
    .select('page_id')
    .eq('user_id', userId);

  if (membershipError) throw membershipError;

  const memberPageIds = (memberships ?? []).map((membership) => membership.page_id);
  let query = supabase
    .from(HYNOE_SEARCH_TABLES.pages)
    .select('id, slug, name, page_type, publication_state, summary, description, canonical_url, location_label, service_area, categories, tags, updated_at')
    .order('updated_at', { ascending: false });

  if (memberPageIds.length > 0) {
    query = query.or(`created_by.eq.${userId},id.in.(${memberPageIds.join(',')})`);
  } else {
    query = query.eq('created_by', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as OwnedPage[];
}
