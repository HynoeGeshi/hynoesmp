import { createClient } from '@/lib/supabase/server';
import { HYNOE_SEARCH_TABLES } from '@/lib/supabase/table-names';

export type OwnedInquiry = {
  id: string;
  page_id: string;
  page_name: string;
  page_slug: string;
  sender_name: string;
  sender_email: string;
  message: string;
  request_type: string | null;
  status: 'new' | 'read' | 'replied' | 'closed' | 'spam';
  created_at: string;
};

export async function getOwnedInquiries(): Promise<OwnedInquiry[]> {
  const supabase = await createClient();
  const { data: inquiries, error } = await supabase
    .from(HYNOE_SEARCH_TABLES.inquiries)
    .select('id, page_id, sender_name, sender_email, message, request_type, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  if (!inquiries?.length) return [];

  const pageIds = [...new Set(inquiries.map((inquiry) => inquiry.page_id))];
  const { data: pages } = await supabase
    .from(HYNOE_SEARCH_TABLES.pages)
    .select('id, name, slug')
    .in('id', pageIds);

  const pageMap = new Map((pages ?? []).map((page) => [page.id, page]));

  return inquiries.map((inquiry) => {
    const page = pageMap.get(inquiry.page_id);
    return {
      ...inquiry,
      page_name: page?.name ?? 'Hynoe Page',
      page_slug: page?.slug ?? '',
    } as OwnedInquiry;
  });
}
