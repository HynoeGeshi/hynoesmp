import type { MetadataRoute } from 'next';
import { flagshipPages } from '@/data/flagship-pages';
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: 'https://hynoe.net/', lastModified: now },
    { url: 'https://hynoe.net/search', lastModified: now },
    ...flagshipPages.map((page) => ({ url: `https://hynoe.net/p/${page.slug}`, lastModified: now })),
  ];
}
