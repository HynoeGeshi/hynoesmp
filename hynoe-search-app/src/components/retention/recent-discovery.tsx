'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { HynoePage } from '@/domain/pages/types';
import { readRetentionState } from '@/domain/retention/browser-retention-store';
import type { RetentionStateV1 } from '@/domain/retention/types';
import styles from './retention.module.css';

export function RecentDiscovery({ pages }: { pages: readonly HynoePage[] }) {
  const [state, setState] = useState<RetentionStateV1 | null>(null);

  useEffect(() => {
    setState(readRetentionState());
  }, []);

  const visiblePages = useMemo(() => {
    if (!state) return [];
    const slugs = [...new Set([
      ...state.savedPageSlugs,
      ...state.followedPageSlugs,
      ...state.recentPageSlugs,
    ])];
    return slugs
      .map((slug) => pages.find((page) => page.slug === slug))
      .filter((page): page is HynoePage => Boolean(page));
  }, [pages, state]);

  if (!state || (!state.recentQueries.length && !visiblePages.length)) return null;

  return (
    <section className={styles.returnSection} aria-labelledby="returning-discovery-title">
      <div className={styles.returnHeader}>
        <div>
          <div className="eyebrow">Your device</div>
          <h2 id="returning-discovery-title">Pick up where you left off</h2>
          <p>Recent searches, viewed Pages, and Pages saved and followed on this device.</p>
        </div>
      </div>

      {state.recentQueries.length ? (
        <nav className={styles.queryRow} aria-label="Recent Hynoe searches">
          {state.recentQueries.map((query) => (
            <Link className={styles.queryLink} href={`/search?q=${encodeURIComponent(query)}`} key={query}>{query}</Link>
          ))}
        </nav>
      ) : null}

      {visiblePages.length ? (
        <div className={styles.pageGrid}>
          {visiblePages.map((page) => (
            <Link className={styles.pageCard} href={`/p/${page.slug}`} key={page.slug} aria-label={page.name}>
              <span>{page.categories[0] ?? 'Hynoe Page'}</span>
              <strong>{page.name}</strong>
              <p>{page.summary}</p>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
