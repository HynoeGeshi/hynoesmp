import { createServerSupabaseClient } from '@/lib/supabase/server';

type PublicationState = 'draft' | 'published';

type UpdateOwnedPageInput = {
  summary: string;
  description: string;
  canonicalUrl: string;
  locationText: string;
  serviceArea: string;
  categories: string[];
  tags: string[];
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  secondaryCtaLabel: string;
  secondaryCtaUrl: string;
  publicationState: PublicationState;
};

type UpdateOwnedPageResult =
  | { ok: true }
  | { ok: false; error: 'invalid-page' | 'update-failed' };

function normalizeList(values: string[], maxItems: number): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, maxItems);
}

function isSafeOptionalHttpsUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function updateOwnedPage(
  pageId: string,
  input: UpdateOwnedPageInput,
): Promise<UpdateOwnedPageResult> {
  const summary = input.summary.trim();
  const description = input.description.trim();
  const canonicalUrl = input.canonicalUrl.trim();
  const locationText = input.locationText.trim();
  const serviceArea = input.serviceArea.trim();
  const primaryCtaLabel = input.primaryCtaLabel.trim();
  const primaryCtaUrl = input.primaryCtaUrl.trim();
  const secondaryCtaLabel = input.secondaryCtaLabel.trim();
  const secondaryCtaUrl = input.secondaryCtaUrl.trim();

  if (
    !pageId ||
    !['draft', 'published'].includes(input.publicationState) ||
    summary.length > 240 ||
    description.length > 5000 ||
    locationText.length > 240 ||
    serviceArea.length > 240 ||
    primaryCtaLabel.length > 80 ||
    secondaryCtaLabel.length > 80 ||
    !isSafeOptionalHttpsUrl(canonicalUrl) ||
    !isSafeOptionalHttpsUrl(primaryCtaUrl) ||
    !isSafeOptionalHttpsUrl(secondaryCtaUrl)
  ) {
    return { ok: false, error: 'invalid-page' };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('pages')
    .update({
      summary,
      description,
      canonical_url: canonicalUrl || null,
      location_text: locationText || null,
      service_area: serviceArea || null,
      categories: normalizeList(input.categories, 8),
      tags: normalizeList(input.tags, 16),
      primary_cta_label: primaryCtaLabel || null,
      primary_cta_url: primaryCtaUrl || null,
      secondary_cta_label: secondaryCtaLabel || null,
      secondary_cta_url: secondaryCtaUrl || null,
      publication_state: input.publicationState,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pageId);

  if (error) {
    return { ok: false, error: 'update-failed' };
  }

  return { ok: true };
}
