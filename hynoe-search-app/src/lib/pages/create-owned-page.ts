import type { HynoePageType } from '@/domain/pages/types';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const PAGE_TYPES = new Set<HynoePageType>([
  'local_business',
  'service_provider',
  'creator',
  'community',
  'digital_product',
  'project_brand',
]);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type CreateOwnedPageInput = {
  name: string;
  slug: string;
  pageType: HynoePageType;
};

type CreateOwnedPageResult =
  | { ok: true; pageId: string; slug: string }
  | { ok: false; error: 'invalid-page' | 'create-failed' };

export async function createOwnedPage(
  userId: string,
  input: CreateOwnedPageInput,
): Promise<CreateOwnedPageResult> {
  const name = input.name.trim();
  const slug = input.slug.trim();

  if (
    !userId ||
    name.length < 1 ||
    name.length > 120 ||
    !SLUG_PATTERN.test(slug) ||
    !PAGE_TYPES.has(input.pageType)
  ) {
    return { ok: false, error: 'invalid-page' };
  }

  const admin = createAdminSupabaseClient();
  const { data: page, error: pageError } = await admin
    .from('pages')
    .insert({
      name,
      slug,
      page_type: input.pageType,
      publication_state: 'draft',
      created_by: userId,
    })
    .select('id, slug')
    .single();

  if (pageError || !page) {
    return { ok: false, error: 'create-failed' };
  }

  const { error: membershipError } = await admin.from('page_members').insert({
    page_id: page.id,
    user_id: userId,
    role: 'owner',
  });

  if (membershipError) {
    await admin.from('pages').delete().eq('id', page.id);
    return { ok: false, error: 'create-failed' };
  }

  return { ok: true, pageId: page.id, slug: page.slug };
}
