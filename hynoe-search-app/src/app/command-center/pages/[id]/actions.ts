'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/require-user';
import { getManagedPage } from '@/lib/pages/manage-page';
import { createClient } from '@/lib/supabase/server';
import { HYNOE_SEARCH_TABLES } from '@/lib/supabase/table-names';

export async function updateHynoePage(formData: FormData) {
  const user = await requireUser();
  const pageId = String(formData.get('page_id') ?? '');
  const page = await getManagedPage(pageId, user.id);
  if (!page) redirect('/command-center');

  const name = String(formData.get('name') ?? '').trim().slice(0, 120);
  const summary = String(formData.get('summary') ?? '').trim().slice(0, 240);
  const description = String(formData.get('description') ?? '').trim().slice(0, 5000);
  const publicationState = formData.get('publication_state') === 'published' ? 'published' : 'draft';
  const canonicalRaw = String(formData.get('canonical_url') ?? '').trim();
  const canonicalUrl = canonicalRaw.startsWith('https://') ? canonicalRaw.slice(0, 500) : null;

  if (!name) redirect(`/command-center/pages/${pageId}?error=invalid_page`);

  const supabase = await createClient();
  const { error } = await supabase
    .from(HYNOE_SEARCH_TABLES.pages)
    .update({
      name,
      summary,
      description,
      canonical_url: canonicalUrl,
      publication_state: publicationState,
      published_at: publicationState === 'published' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pageId);

  if (error) redirect(`/command-center/pages/${pageId}?error=save_failed`);

  revalidatePath('/command-center');
  revalidatePath(`/command-center/pages/${pageId}`);
  revalidatePath(`/p/${page.slug}`);
  redirect(`/command-center/pages/${pageId}?saved=1`);
}
