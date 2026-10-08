import { notFound } from 'next/navigation';
import { PageShell } from '@/components/page/page-shell';
import { getDiscoverablePageBySlug } from '@/lib/pages/public-pages';
import { buildPageMetadata } from '@/lib/seo/page-metadata';

// Public database Pages use a request-scoped Supabase client. Prerendering only
// the flagship slugs makes later database/missing slugs throw a cookies-related
// static-to-dynamic error. Keep all slugs in the same request-time mode.
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getDiscoverablePageBySlug(slug);
  return page ? buildPageMetadata(page) : {};
}

export default async function HynoePageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getDiscoverablePageBySlug(slug);
  if (!page) notFound();
  return <PageShell page={page} inquiryPageId={UUID.test(page.id) ? page.id : undefined} />;
}
