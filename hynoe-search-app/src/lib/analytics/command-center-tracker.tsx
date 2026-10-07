'use client';

import { useEffect } from 'react';
import { trackEvent } from './track-event';

export function CommandCenterTracker({ pageCount }: { pageCount: number }) {
  useEffect(() => {
    trackEvent('command_center_viewed', {
      page_count: pageCount,
      source: 'command_center',
    });
  }, [pageCount]);

  return null;
}
