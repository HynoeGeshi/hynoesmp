import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return { name: 'Hynoe Search', short_name: 'Hynoe', description: 'Find what is worth discovering.', start_url: '/', display: 'standalone', background_color: '#08090b', theme_color: '#08090b' };
}
