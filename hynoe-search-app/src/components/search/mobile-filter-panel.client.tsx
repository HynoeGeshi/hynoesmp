'use client';

import { useState } from 'react';
import { FilterBar } from './filter-bar';
import styles from './mobile-filter-panel.module.css';

export function MobileFilterPanelClient({ query, activeType }: { query: string; activeType?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.panel} data-open={open ? 'true' : 'false'}>
      <button
        type="button"
        className={styles.summary}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Filters
      </button>
      {open ? (
        <div className={styles.body}>
          <FilterBar query={query} activeType={activeType} />
        </div>
      ) : null}
    </div>
  );
}
