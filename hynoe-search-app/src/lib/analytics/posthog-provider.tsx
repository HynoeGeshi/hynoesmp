'use client';

import { useEffect, type ReactNode } from 'react';
import posthog from 'posthog-js';

let initialized = false;

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
    if (!key || initialized) return;

    try {
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
      initialized = true;
    } catch {
      initialized = false;
    }
  }, []);

  return children;
}
