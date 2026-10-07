import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/search', '/p/'],
      disallow: ['/command-center', '/sign-in', '/auth/', '/api/', '/account', '/admin'],
    },
    sitemap: 'https://hynoe.net/sitemap.xml',
  };
}
