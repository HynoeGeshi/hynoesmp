import type { HynoePage, HynoePageType } from '../pages/types';
export type SearchFilters = { pageType?: HynoePageType; category?: string };
export type SearchResult = { page: HynoePage; score: number; matchedFields: string[] };
