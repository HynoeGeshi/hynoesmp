'use client';

import { useEffect, useState } from 'react';
import { readRetentionState, recordPageView, toggleFollowed, toggleSaved } from '@/domain/retention/browser-retention-store';
import { trackEvent } from '@/lib/analytics/track-event';
import styles from './retention.module.css';

export function SaveFollowControls({ slug }: { slug: string }) {
  const [saved, setSaved] = useState(false);
  const [followed, setFollowed] = useState(false);

  useEffect(() => {
    recordPageView(slug);
    const state = readRetentionState();
    setSaved(state.savedPageSlugs.includes(slug));
    setFollowed(state.followedPageSlugs.includes(slug));
  }, [slug]);

  const handleSave = () => {
    const next = toggleSaved(slug);
    setSaved(next);
    trackEvent('page_saved', {
      page_slug: slug,
      action_state: next ? 'saved' : 'unsaved',
    });
  };

  const handleFollow = () => {
    const next = toggleFollowed(slug);
    setFollowed(next);
    trackEvent('page_followed', {
      page_slug: slug,
      action_state: next ? 'followed' : 'unfollowed',
    });
  };

  return (
    <div className={styles.controls} aria-label="Device-local Page actions">
      <button
        type="button"
        className={styles.control}
        aria-pressed={saved}
        onClick={handleSave}
      >
        {saved ? 'Saved' : 'Save Page'}
      </button>
      <button
        type="button"
        className={styles.control}
        aria-pressed={followed}
        onClick={handleFollow}
      >
        {followed ? 'Following' : 'Follow Page'}
      </button>
      <p className={styles.localNote}>Saved and followed Pages stay on this device until Hynoe accounts launch.</p>
    </div>
  );
}
