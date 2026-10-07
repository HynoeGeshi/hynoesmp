'use server';

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/require-user';
import { RESERVED_HYNOE_SLUGS } from '@/lib/pages/reserved-slugs';
import { createClient } from '@/lib/supabase/server';
import { HYNOE_SEARCH_TABLES } from '@/lib/supabase/table-names';

const pageTypes = new Set(['local_business','service_provider','creator','community','digital_product','project_brand']);

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

export async function createHynoePage(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get('name') ?? '').trim().slice(0, 120);
  const summary = String(formData.get('summary') ?? '').trim().slice(0, 240);
  const requestedType = String(formData.get('page_type') ?? 'project_brand');
  const pageType = pageTypes.has(requestedType) ? requestedType : 'project_brand';
  const slug = slugify(String(formData.get('slug') ?? '') || name);

  if (!name || slug.length < 2) redirect('/command-center/pages/new?error=invalid_page');
  if (RESERVED_HYNOE_SLUGS.has(slug)) redirect('/command-center/pages/new?error=reserved_slug');

  const supabase = await createClient();
  const { data: page, error } = await supabase
    .from(HYNOE_SEARCH_TABLES.pages)
    .insert({ created_by: user.id, name, summary, slug, page_type: pageType, publication_state: 'draft' })
    .select('id')
    .single();

  if (error || !page) redirect('/command-center/pages/new?error=create_failed');

  const { error: memberError } = await supabase
    .from(HYNOE_SEARCH_TABLES.pageMembers)
    .insert({ page_id: page.id, user_id: user.id, role: 'owner' });

  if (memberError) {
    await supabase.from(HYNOE_SEARCH_TABLES.pages).delete().eq('id', page.id);
    redirect('/command-center/pages/new?error=create_failed');
  }

  redirect(`/command-center/pages/${page.id}`);
}
