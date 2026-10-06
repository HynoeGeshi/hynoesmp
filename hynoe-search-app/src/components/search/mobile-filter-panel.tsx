import { FilterBar } from './filter-bar';
import styles from './mobile-filter-panel.module.css';

export function MobileFilterPanel({ query, activeType }: { query: string; activeType?: string }) {
  return (
    <details className={styles.panel}>
      <summary className={styles.summary}>Filters</summary>
      <div className={styles.body}>
        <FilterBar query={query} activeType={activeType} />
      </div>
    </details>
  );
}
