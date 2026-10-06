'use client';

import { useEffect } from 'react';
import { trackEvent } from './track-event';

export function PageViewTracker({ slug, pageType }: { slug: string; pageType: string }) {
  useEffect(() => {
    trackEvent('page_viewed', {
      page_slug: slug,
      page_type: pageType,
      source: 'hynoe_page',
    });
  }, [slug, pageType]);

  return null;
}
