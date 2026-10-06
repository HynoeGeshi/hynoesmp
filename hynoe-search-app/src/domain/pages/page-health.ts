import type { HynoePage, PageModule } from './types';

export type PageHealthRecommendationId =
  | 'summary'
  | 'description'
  | 'categories'
  | 'tags'
  | 'canonical-url'
  | 'service-area'
  | 'services'
  | 'portfolio'
  | 'publish';

export type PageHealthRecommendation = {
  id: PageHealthRecommendationId;
  title: string;
  description: string;
  points: number;
};

export type PageHealthResult = {
  score: number;
  label: 'Needs work' | 'Good' | 'Strong';
  explanation: string;
  recommendations: PageHealthRecommendation[];
};

type HealthCheck = PageHealthRecommendation & {
  satisfied: (page: HynoePage) => boolean;
};

function moduleHasItems(
  page: HynoePage,
  type: Extract<PageModule, { items: unknown[] }>['type'],
): boolean {
  return page.modules.some((module) => module.type === type && module.items.length > 0);
}

const checks: HealthCheck[] = [
  {
    id: 'summary',
    title: 'Strengthen your summary',
    description: 'Add a clear one-line summary that tells visitors what you do and who you help.',
    points: 15,
    satisfied: (page) => page.summary.trim().length >= 80,
  },
  {
    id: 'description',
    title: 'Tell visitors more',
    description: 'Add enough detail for someone to understand your work before contacting you.',
    points: 15,
    satisfied: (page) => page.description.trim().length >= 200,
  },
  {
    id: 'categories',
    title: 'Choose a category',
    description: 'Add at least one accurate category so Hynoe can describe your Page clearly.',
    points: 10,
    satisfied: (page) => page.categories.length > 0,
  },
  {
    id: 'tags',
    title: 'Add useful tags',
    description: 'Add at least three specific tags that describe your specialties or audience.',
    points: 10,
    satisfied: (page) => page.tags.length >= 3,
  },
  {
    id: 'canonical-url',
    title: 'Connect your official website',
    description: 'Add a secure official destination visitors can trust and use outside Hynoe.',
    points: 10,
    satisfied: (page) => page.canonicalUrl.startsWith('https://'),
  },
  {
    id: 'service-area',
    title: 'Clarify where you work',
    description: 'Add a service area, location, or mark the Page as online-only.',
    points: 10,
    satisfied: (page) =>
      Boolean(
        page.location?.onlineOnly ||
          page.location?.city ||
          page.location?.region ||
          page.location?.country,
      ),
  },
  {
    id: 'services',
    title: 'Add your services',
    description: 'Show at least one concrete service or offering so visitors know what they can request.',
    points: 15,
    satisfied: (page) => moduleHasItems(page, 'services'),
  },
  {
    id: 'portfolio',
    title: 'Show your work',
    description: 'Add at least one portfolio example that helps visitors understand your quality or fit.',
    points: 10,
    satisfied: (page) => moduleHasItems(page, 'portfolio'),
  },
  {
    id: 'publish',
    title: 'Publish your Page',
    description: 'Publish when the Page is ready so people can discover it publicly.',
    points: 5,
    satisfied: (page) => page.status === 'published',
  },
];

export function calculatePageHealth(page: HynoePage): PageHealthResult {
  const recommendations = checks
    .filter((check) => !check.satisfied(page))
    .map(({ satisfied: _satisfied, ...recommendation }) => recommendation);

  const missingPoints = recommendations.reduce((total, item) => total + item.points, 0);
  const score = 100 - missingPoints;
  const label = score >= 80 ? 'Strong' : score >= 50 ? 'Good' : 'Needs work';

  return {
    score,
    label,
    explanation:
      'Page Health measures profile completeness and useful visitor context. It is not a secret search score.',
    recommendations,
  };
}
