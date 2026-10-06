'use client';

import posthog from 'posthog-js';
import { sanitizeAnalyticsProperties, type HynoeAnalyticsEvent } from './events';

export function trackEvent(
  event: HynoeAnalyticsEvent,
  properties: Record<string, unknown> = {},
): void {
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  try {
    posthog.capture(event, sanitizeAnalyticsProperties(properties));
  } catch {
    // Analytics must never block navigation or product actions.
  }
}
