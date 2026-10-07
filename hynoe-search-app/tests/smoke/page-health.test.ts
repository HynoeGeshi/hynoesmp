import { describe, expect, it } from 'vitest';
import { scorePageHealth } from '../../src/lib/pages/page-health';

describe('Hynoe Page health', () => {
  it('treats a complete published creator Page as 90+ launch-ready', () => {
    const health = scorePageHealth({
      pageType: 'creator',
      publicationState: 'published',
      name: 'Hynoe Creator',
      summary: 'Gaming creator covering streams, progression, builds, clips, and community-driven content.',
      description: 'A complete creator profile with enough detail to explain the work, audience, proof, specialties, current focus, and what a visitor should do next. This gives Hynoe Search useful context and gives a visitor enough information to decide whether to follow, hire, or explore more.',
      canonicalUrl: 'https://example.com',
      categories: ['Gaming', 'Streaming'],
      tags: ['minecraft', 'gears', 'streamer', 'creator'],
      locationLabel: null,
      serviceArea: null,
    });

    expect(health.score).toBeGreaterThanOrEqual(90);
    expect(health.band).toBe('strong');
  });

  it('gives actionable recommendations to an incomplete draft', () => {
    const health = scorePageHealth({
      pageType: 'creator',
      publicationState: 'draft',
      name: 'A',
      summary: '',
      description: '',
      canonicalUrl: null,
      categories: [],
      tags: [],
      locationLabel: null,
      serviceArea: null,
    });

    expect(health.score).toBeLessThan(50);
    expect(health.recommendations.join(' ')).toContain('summary');
    expect(health.recommendations.join(' ')).toContain('categories');
    expect(health.recommendations.join(' ')).toContain('Publish');
  });

  it('requires location context for local businesses and service providers', () => {
    const health = scorePageHealth({
      pageType: 'service_provider',
      publicationState: 'published',
      name: 'Southland Photo Studio',
      summary: 'Portrait and event photography serving clients across the south suburbs and greater Chicago area.',
      description: 'Portrait, event, and brand photography with a clear booking process, examples of the work, service details, client expectations, and a simple next step for people who want to inquire or book a session. The Page is written for people actively looking for a photographer nearby.',
      canonicalUrl: 'https://example.com',
      categories: ['Photography', 'Creative Services'],
      tags: ['photographer', 'portraits', 'events', 'chicago'],
      locationLabel: null,
      serviceArea: null,
    });

    expect(health.recommendations.join(' ')).toContain('location');
    expect(health.score).toBeLessThan(100);
  });
});
