import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ANALYTICS_EVENTS, sanitizeAnalyticsProperties } from '@/lib/analytics/events';
import { trackEvent } from '@/lib/analytics/track-event';

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Hynoe analytics event contract', () => {
  it('exposes the approved retention, discovery, inquiry, and owner-workspace events', () => {
    expect(ANALYTICS_EVENTS).toEqual([
      'search_submitted',
      'search_result_clicked',
      'page_viewed',
      'page_saved',
      'page_followed',
      'inquiry_submitted',
      'command_center_viewed',
      'page_created',
      'page_published',
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

  it('is a safe no-op when PostHog is not configured', () => {
    const originalKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;

    expect(() => trackEvent('page_viewed', { page_slug: 'hynoe-smp' })).not.toThrow();

    if (originalKey) process.env.NEXT_PUBLIC_POSTHOG_KEY = originalKey;
  });

  it('lazy-loads PostHog instead of shipping it in the initial client bundle', () => {
    const provider = source('src/lib/analytics/posthog-provider.tsx');
    const tracker = source('src/lib/analytics/track-event.ts');

    expect(provider).not.toMatch(/import posthog from ['"]posthog-js['"]/);
    expect(tracker).not.toMatch(/import posthog from ['"]posthog-js['"]/);
    expect(`${provider}\n${tracker}`).toContain("import('posthog-js')");
  });
});
