import { MobileFilterPanelClient } from './mobile-filter-panel.client';

export function MobileFilterPanel({ query, activeType }: { query: string; activeType?: string }) {
  return <MobileFilterPanelClient query={query} activeType={activeType} />;
}
