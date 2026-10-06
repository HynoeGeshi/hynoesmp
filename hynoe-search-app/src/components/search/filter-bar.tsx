const filters = [
  ['All', ''], ['Businesses', 'local_business'], ['Services', 'service_provider'], ['Creators', 'creator'],
  ['Communities', 'community'], ['Games & Apps', 'digital_product'], ['Projects', 'project_brand'],
] as const;

export function FilterBar({ query, activeType }: { query: string; activeType?: string }) {
  return <nav className="filter-bar" aria-label="Search filters">
    {filters.map(([label, value]) => {
      const params = new URLSearchParams(); if (query) params.set('q', query); if (value) params.set('type', value);
      const href = `/search${params.size ? `?${params}` : ''}`;
      return <a key={label} href={href} aria-current={(activeType ?? '') === value ? 'page' : undefined}>{label}</a>;
    })}
  </nav>;
}
