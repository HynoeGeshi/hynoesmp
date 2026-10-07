'use client';

import { useEffect, type ReactNode } from 'react';
import { setAnalyticsClient } from './posthog-state';

let initialized = false;
let initializing = false;

const URL_PROPERTY_KEYS = [
  '$current_url',
  '$initial_current_url',
  '$referrer',
  '$initial_referrer',
  '$referring_domain',
  '$session_entry_url',
] as const;

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || initialized || initializing) return;

    let cancelled = false;
    initializing = true;

    const initialize = async () => {
      try {
        const { default: posthog } = await import('posthog-js');
        if (cancelled || initialized) return;

        posthog.init(key, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
          autocapture: false,
          capture_pageview: false,
          capture_pageleave: false,
          disable_session_recording: true,
          disable_persistence: true,
          person_profiles: 'identified_only',
          before_send: (event) => {
            if (!event?.properties) return event;
            for (const keyName of URL_PROPERTY_KEYS) delete event.properties[keyName];
            return event;
          },
        });

        setAnalyticsClient(posthog);
        initialized = true;
      } catch {
        initialized = false;
      } finally {
        initializing = false;
      }
    };

    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (idleWindow.requestIdleCallback) {
      const id = idleWindow.requestIdleCallback(() => void initialize(), { timeout: 1800 });
      return () => {
        cancelled = true;
        idleWindow.cancelIdleCallback?.(id);
        initializing = false;
      };
    }

    const timeout = window.setTimeout(() => void initialize(), 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      initializing = false;
    };
  }, []);

  return children;
}
