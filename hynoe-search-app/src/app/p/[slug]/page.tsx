import { notFound } from 'next/navigation';
import { PageShell } from '@/components/page/page-shell';
import { flagshipPages } from '@/data/flagship-pages';
import { buildPageMetadata } from '@/lib/seo/page-metadata';

export function generateStaticParams() { return flagshipPages.map((page) => ({ slug: page.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = flagshipPages.find((item) => item.slug === slug);
  return page ? buildPageMetadata(page) : {};
}

export default async function HynoePageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = flagshipPages.find((item) => item.slug === slug);
  if (!page) notFound();
  return <PageShell page={page} />;
}
