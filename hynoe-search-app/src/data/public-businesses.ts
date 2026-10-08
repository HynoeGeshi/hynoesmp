import type { HynoePage } from '../domain/pages/types';

export type PublicBusiness = {
  slug: string;
  name: string;
  summary: string;
  category: 'Creative software' | 'Music' | 'Photo & video';
  pageType: 'local_business' | 'digital_product';
  city?: string;
  region?: string;
  website: string;
  sourceUrl: string;
  checkedAt: string;
  status: 'unclaimed';
  relationship: 'none';
  keywords: string[];
};

// Manually reviewed public facts. No scraped descriptions, logos, reviews,
// personal contacts, paid placement, or assertion that these businesses joined Hynoe.
export const publicBusinesses: readonly PublicBusiness[] = [
  { slug: 'directory-adobe', name: 'Adobe', summary: 'Software for photo editing, graphic design, video and digital documents.', category: 'Creative software', pageType: 'digital_product', website: 'https://www.adobe.com/', sourceUrl: 'https://www.adobe.com/', checkedAt: '2026-10-07', status: 'unclaimed', relationship: 'none', keywords: ['design', 'photography', 'video', 'software', 'photoshop', 'online'] },
  { slug: 'directory-ableton', name: 'Ableton', summary: 'Music-making software and hardware, including Live and Push.', category: 'Music', pageType: 'digital_product', website: 'https://www.ableton.com/en/', sourceUrl: 'https://www.ableton.com/en/', checkedAt: '2026-10-07', status: 'unclaimed', relationship: 'none', keywords: ['music', 'audio', 'production', 'software', 'live', 'online'] },
  { slug: 'directory-bh-photo-video', name: 'B&H Photo Video', summary: 'Retailer of photography, video, audio and computer equipment.', category: 'Photo & video', pageType: 'local_business', website: 'https://www.bhphotovideo.com/', sourceUrl: 'https://www.bhphotovideo.com/', checkedAt: '2026-10-07', status: 'unclaimed', relationship: 'none', keywords: ['camera', 'photography', 'video', 'audio', 'retail', 'online'] },
  { slug: 'directory-canva', name: 'Canva', summary: 'Visual design tools for presentations, social content and other creative projects.', category: 'Creative software', pageType: 'digital_product', website: 'https://www.canva.com/', sourceUrl: 'https://www.canva.com/', checkedAt: '2026-10-07', status: 'unclaimed', relationship: 'none', keywords: ['design', 'presentations', 'social', 'creative', 'software', 'online'] },
  { slug: 'directory-chicago-music-exchange', name: 'Chicago Music Exchange', summary: 'Musical-instrument retailer with a Chicago showroom and an online store.', category: 'Music', pageType: 'local_business', city: 'Chicago', region: 'Illinois', website: 'https://www.chicagomusicexchange.com/', sourceUrl: 'https://www.chicagomusicexchange.com/pages/about-contact-us', checkedAt: '2026-10-07', status: 'unclaimed', relationship: 'none', keywords: ['chicago', 'illinois', 'guitar', 'instruments', 'music', 'retail', 'online'] },
];

export function getPublicBusiness(slug: string): PublicBusiness | undefined {
  return publicBusinesses.find((business) => business.slug === slug);
}

export function sourceNeedsReview(checkedAt: string, now = new Date()): boolean {
  const checked = Date.parse(`${checkedAt}T00:00:00Z`);
  return !Number.isFinite(checked) || checked > now.getTime() || now.getTime() - checked > 90 * 86400000;
}

export function toDirectoryPage(business: PublicBusiness): HynoePage {
  return {
    id: business.slug, slug: business.slug, name: business.name,
    pageType: business.pageType, summary: business.summary,
    description: 'An independently compiled public-information listing. This business has not claimed this page. Inclusion is not a partnership, approval or endorsement in either direction.',
    categories: [business.category], tags: [...business.keywords], status: 'published', featured: false,
    canonicalUrl: business.website,
    ...(business.city ? { location: { city: business.city, region: business.region, country: 'United States' } } : {}),
    modules: [{ type: 'cta', label: 'Visit the business website', url: business.website, description: 'You are leaving Hynoe. Check current services, prices and availability with the business directly.' }],
  };
}

export const publicBusinessPages = publicBusinesses.map(toDirectoryPage);
