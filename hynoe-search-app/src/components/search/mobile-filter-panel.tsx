import { FilterBar } from './filter-bar';

export function MobileFilterPanel({ query, activeType }: { query: string; activeType?: string }) {
  return (
    <details className="mobile-filter-panel">
      <summary>Filters</summary>
      <div className="mobile-filter-panel__body">
        <FilterBar query={query} activeType={activeType} />
      </div>
    </details>
  );
}
