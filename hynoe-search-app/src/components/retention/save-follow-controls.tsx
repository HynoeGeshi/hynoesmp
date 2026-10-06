'use client';

import { useEffect, useState } from 'react';
import { readRetentionState, recordPageView, toggleFollowed, toggleSaved } from '@/domain/retention/browser-retention-store';
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

  return (
    <div className={styles.controls} aria-label="Device-local Page actions">
      <button
        type="button"
        className={styles.control}
        aria-pressed={saved}
        onClick={() => setSaved(toggleSaved(slug))}
      >
        {saved ? 'Saved' : 'Save Page'}
      </button>
      <button
        type="button"
        className={styles.control}
        aria-pressed={followed}
        onClick={() => setFollowed(toggleFollowed(slug))}
      >
        {followed ? 'Following' : 'Follow Page'}
      </button>
      <p className={styles.localNote}>Saved and followed Pages stay on this device until Hynoe accounts launch.</p>
    </div>
  );
}
