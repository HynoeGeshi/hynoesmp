import { notFound } from 'next/navigation';
import { PageShell } from '@/components/page/page-shell';
import { getPublicBusiness } from '@/data/public-businesses';
import { getDiscoverablePageBySlug } from '@/lib/pages/public-pages';
import { buildPageMetadata } from '@/lib/seo/page-metadata';

// Preserve the request-time mode required by database pages and unknown slugs.
// It also ensures source-age warnings are evaluated when a page is requested.
export const dynamic = 'force-dynamic';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getDiscoverablePageBySlug(slug);
  if (!page) return {};
  const metadata = await buildPageMetadata(page);
  return getPublicBusiness(slug) ? { ...metadata, title: `${page.name} — unclaimed public listing | Hynoe`, robots: { index: false, follow: true } } : metadata;
}

export default async function HynoePageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getDiscoverablePageBySlug(slug);
  if (!page) notFound();
  return <PageShell page={page} inquiryPageId={!getPublicBusiness(slug) && UUID.test(page.id) ? page.id : undefined} />;
}
