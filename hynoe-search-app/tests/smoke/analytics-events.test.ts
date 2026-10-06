import { describe, expect, it } from 'vitest';
import { ANALYTICS_EVENTS, sanitizeAnalyticsProperties } from '@/lib/analytics/events';

describe('Hynoe analytics event contract', () => {
  it('exposes only the five approved public retention/discovery events', () => {
    expect(ANALYTICS_EVENTS).toEqual([
      'search_submitted',
      'search_result_clicked',
      'page_viewed',
      'page_saved',
      'page_followed',
    ]);
  });

  it('drops sensitive or freeform properties before analytics capture', () => {
    expect(sanitizeAnalyticsProperties({
      page_slug: 'hynoe-smp',
      page_type: 'community',
      result_position: 1,
      email: 'person@example.com',
      message: 'private inquiry text',
      exact_location: '123 Main St',
      latitude: 41.5,
      longitude: -87.6,
      query: 'private raw query',
    })).toEqual({
      page_slug: 'hynoe-smp',
      page_type: 'community',
      result_position: 1,
    });
  });

  it('keeps only primitive safe values and ignores unknown complex data', () => {
    expect(sanitizeAnalyticsProperties({
      has_query: true,
      query_length: 12,
      page_slug: 'hynoe-flicks',
      nested: { secret: true },
      list: ['nope'],
      nothing: null,
    } as Record<string, unknown>)).toEqual({
      has_query: true,
      query_length: 12,
      page_slug: 'hynoe-flicks',
    });
  });
});
