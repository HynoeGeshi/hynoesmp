import type { Metadata } from 'next';
import type { HynoePage } from '@/domain/pages/types';

export function buildPageMetadata(page: HynoePage): Metadata {
  return {
    title: `${page.name} | Hynoe`,
    description: page.summary,
    alternates: { canonical: `https://hynoe.net/p/${page.slug}` },
    openGraph: { title: `${page.name} | Hynoe`, description: page.summary, url: `https://hynoe.net/p/${page.slug}`, type: 'website' },
  };
}
