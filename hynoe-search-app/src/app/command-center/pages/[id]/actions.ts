'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/require-user';
import { getManagedPage } from '@/lib/pages/manage-page';
import { createClient } from '@/lib/supabase/server';
import { HYNOE_SEARCH_TABLES } from '@/lib/supabase/table-names';

function parseList(value: FormDataEntryValue | null, maxItems: number, maxLength: number) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const raw of String(value ?? '').split(',')) {
    const item = raw.trim().replace(/\s+/g, ' ').slice(0, maxLength);
    const key = item.toLowerCase();
    if (!item || seen.has(key)) continue;
    seen.add(key);
    output.push(item);
    if (output.length >= maxItems) break;
  }

  return output;
}

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
  const locationLabel = String(formData.get('location_label') ?? '').trim().slice(0, 160) || null;
  const serviceArea = String(formData.get('service_area') ?? '').trim().slice(0, 240) || null;
  const categories = parseList(formData.get('categories'), 12, 80);
  const tags = parseList(formData.get('tags'), 24, 60);

  if (!name) redirect(`/command-center/pages/${pageId}?error=invalid_page`);
  if (publicationState === 'published' && (!summary || !description)) {
    redirect(`/command-center/pages/${pageId}?error=publish_incomplete`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from(HYNOE_SEARCH_TABLES.pages)
    .update({
      name,
      summary,
      description,
      canonical_url: canonicalUrl,
      location_label: locationLabel,
      service_area: serviceArea,
      categories,
      tags,
      publication_state: publicationState,
      published_at: publicationState === 'published' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pageId);

  if (error) redirect(`/command-center/pages/${pageId}?error=save_failed`);

  revalidatePath('/command-center');
  revalidatePath(`/command-center/pages/${pageId}`);
  revalidatePath(`/p/${page.slug}`);
  revalidatePath('/search');
  redirect(`/command-center/pages/${pageId}?saved=1`);
}
