import { describe, expect, it } from 'vitest';
import type { HynoePage } from '@/domain/pages/types';
import { calculatePageHealth } from '@/domain/pages/page-health';

function page(overrides: Partial<HynoePage> = {}): HynoePage {
  return {
    id: 'page-1',
    slug: 'example-page',
    name: 'Example Page',
    pageType: 'service_provider',
    summary: '',
    description: '',
    categories: [],
    tags: [],
    status: 'draft',
    featured: false,
    canonicalUrl: 'https://example.com',
    modules: [],
    ...overrides,
  };
}

describe('calculatePageHealth', () => {
  it('returns explainable recommendations for an incomplete page', () => {
    const result = calculatePageHealth(page());

    expect(result.score).toBeLessThan(50);
    expect(result.label).toBe('Needs work');
    expect(result.recommendations.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        'summary',
        'description',
        'categories',
        'tags',
        'service-area',
        'services',
        'portfolio',
        'publish',
      ]),
    );
  });

  it('reaches 100 only when the completeness signals are present', () => {
    const result = calculatePageHealth(
      page({
        summary:
          'Experienced event photographer serving families, brands, and independent creators across Chicagoland.',
        description:
          'A complete service profile with clear expectations, a detailed creative approach, turnaround information, and examples of the kinds of clients and projects this provider is best suited to help. This description gives visitors enough context to decide whether to make contact.',
        categories: ['Photography'],
        tags: ['events', 'portraits', 'creators'],
        status: 'published',
        location: { city: 'Chicago', region: 'IL', country: 'US' },
        modules: [
          {
            type: 'services',
            items: [{ name: 'Event photography', description: 'Coverage for events.' }],
          },
          {
            type: 'portfolio',
            items: [{ title: 'Recent event', description: 'Selected work.' }],
          },
        ],
      }),
    );

    expect(result.score).toBe(100);
    expect(result.label).toBe('Strong');
    expect(result.recommendations).toEqual([]);
  });

  it('describes completeness rather than promising ranking', () => {
    const result = calculatePageHealth(page());
    expect(result.explanation.toLowerCase()).toContain('completeness');
    expect(result.explanation.toLowerCase()).not.toContain('guarantee');
    expect(result.explanation.toLowerCase()).not.toContain('rank higher');
  });
});
