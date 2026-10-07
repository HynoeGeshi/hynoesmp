'use client';

import { useEffect } from 'react';
import { trackEvent } from './track-event';

export function PageLifecycleTracker({
  created,
  published,
  pageSlug,
  pageType,
}: {
  created: boolean;
  published: boolean;
  pageSlug: string;
  pageType: string;
}) {
  useEffect(() => {
    if (created) {
      trackEvent('page_created', {
        page_slug: pageSlug,
        page_type: pageType,
        source: 'command_center',
      });
    }
    if (published) {
      trackEvent('page_published', {
        page_slug: pageSlug,
        page_type: pageType,
        source: 'command_center',
      });
    }
  }, [created, published, pageSlug, pageType]);

  return null;
}
