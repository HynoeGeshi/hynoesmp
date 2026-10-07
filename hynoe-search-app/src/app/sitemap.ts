import type { MetadataRoute } from 'next';
import { listDiscoverablePages } from '@/lib/pages/public-pages';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages = await listDiscoverablePages();

  return [
    {
      url: 'https://hynoe.net/',
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    ...pages.map((page) => ({
      url: `https://hynoe.net/p/${page.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: page.featured ? 0.9 : 0.7,
    })),
  ];
}
