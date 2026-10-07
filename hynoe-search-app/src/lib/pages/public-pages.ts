import { flagshipPages } from '@/data/flagship-pages';
import type { HynoePage, HynoePageType } from '@/domain/pages/types';
import { createClient } from '@/lib/supabase/server';
import { HYNOE_SEARCH_TABLES } from '@/lib/supabase/table-names';

const pageTypes = new Set<HynoePageType>([
  'local_business',
  'service_provider',
  'creator',
  'community',
  'digital_product',
  'project_brand',
]);

const flagshipSlugs = new Set(flagshipPages.map((page) => page.slug));

type DatabasePageRow = {
  id: string;
  slug: string;
  name: string;
  page_type: string;
  summary: string | null;
  description: string | null;
  canonical_url: string | null;
  categories: string[] | null;
  tags: string[] | null;
  publication_state: string;
};

function isHttpsUrl(value: string | null): value is string {
  if (!value) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function mapPublishedDatabasePage(row: DatabasePageRow): HynoePage | null {
  if (row.publication_state !== 'published') return null;
  if (!pageTypes.has(row.page_type as HynoePageType)) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug) || !row.name.trim()) return null;

  const summary = row.summary?.trim() || `${row.name} on Hynoe.`;
  const description = row.description?.trim() || summary;
  const canonicalUrl = isHttpsUrl(row.canonical_url)
    ? row.canonical_url
    : `https://hynoe.net/p/${row.slug}`;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name.trim(),
    pageType: row.page_type as HynoePageType,
    summary,
    description,
    categories: Array.isArray(row.categories) ? row.categories.filter(Boolean).slice(0, 12) : [],
    tags: Array.isArray(row.tags) ? row.tags.filter(Boolean).slice(0, 24) : [],
    status: 'published',
    featured: false,
    canonicalUrl,
    modules: isHttpsUrl(row.canonical_url)
      ? [{ type: 'cta', label: `Visit ${row.name.trim()}`, url: row.canonical_url }]
      : [],
  };
}

export async function getPublishedDatabasePages(): Promise<HynoePage[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(HYNOE_SEARCH_TABLES.pages)
      .select('id, slug, name, page_type, summary, description, canonical_url, categories, tags, publication_state')
      .eq('publication_state', 'published')
      .order('updated_at', { ascending: false });

    if (error) return [];
    return ((data ?? []) as DatabasePageRow[])
      .map(mapPublishedDatabasePage)
      .filter((page): page is HynoePage => Boolean(page));
  } catch {
    return [];
  }
}

export async function listDiscoverablePages(): Promise<readonly HynoePage[]> {
  const databasePages = await getPublishedDatabasePages();
  return [
    ...flagshipPages,
    ...databasePages.filter((page) => !flagshipSlugs.has(page.slug)),
  ];
}

export async function getDiscoverablePageBySlug(slug: string): Promise<HynoePage | null> {
  const flagship = flagshipPages.find((page) => page.slug === slug);
  if (flagship) return flagship;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(HYNOE_SEARCH_TABLES.pages)
      .select('id, slug, name, page_type, summary, description, canonical_url, categories, tags, publication_state')
      .eq('slug', slug)
      .eq('publication_state', 'published')
      .maybeSingle();

    if (error || !data) return null;
    return mapPublishedDatabasePage(data as DatabasePageRow);
  } catch {
    return null;
  }
}
