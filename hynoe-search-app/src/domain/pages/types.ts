export type HynoePageType =
  | 'local_business'
  | 'service_provider'
  | 'creator'
  | 'community'
  | 'digital_product'
  | 'project_brand';

export type PageLocation = {
  city?: string;
  region?: string;
  country?: string;
  onlineOnly?: boolean;
};

export type PageModule =
  | { type: 'hero'; headline: string; subheadline?: string }
  | { type: 'links'; links: Array<{ label: string; url: string }> }
  | { type: 'features'; items: Array<{ title: string; description: string }> }
  | { type: 'services'; items: Array<{ name: string; description?: string; priceLabel?: string }> }
  | { type: 'portfolio'; items: Array<{ title: string; description?: string; imageUrl?: string }> }
  | { type: 'updates'; items: Array<{ title: string; summary: string; publishedAt?: string }> }
  | { type: 'community'; description: string; memberLabel?: string }
  | { type: 'media'; items: Array<{ title: string; url: string }> }
  | { type: 'cta'; label: string; url: string; description?: string };

export type HynoePage = {
  id: string;
  slug: string;
  name: string;
  pageType: HynoePageType;
  summary: string;
  description: string;
  categories: string[];
  tags: string[];
  status: 'published' | 'draft';
  featured: boolean;
  canonicalUrl: string;
  location?: PageLocation;
  modules: PageModule[];
};

export interface PageRepository {
  list(): Promise<readonly HynoePage[]>;
  getBySlug(slug: string): Promise<HynoePage | null>;
}
