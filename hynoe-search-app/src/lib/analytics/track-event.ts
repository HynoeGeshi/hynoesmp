'use client';

import { sanitizeAnalyticsProperties, type HynoeAnalyticsEvent } from './events';
import { captureOrQueueAnalytics } from './posthog-state';

export function trackEvent(
  event: HynoeAnalyticsEvent,
  properties: Record<string, unknown> = {},
): void {
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  captureOrQueueAnalytics(event, sanitizeAnalyticsProperties(properties));
}
