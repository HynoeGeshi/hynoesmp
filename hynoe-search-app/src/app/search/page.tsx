import Link from 'next/link';
import { SearchForm } from '@/components/search/search-form';
import { FilterBar } from '@/components/search/filter-bar';
import { ResultCard } from '@/components/search/result-card';
import { flagshipPages } from '@/data/flagship-pages';
import { searchPages } from '@/domain/search/search-pages';
import type { HynoePageType } from '@/domain/pages/types';

const pageTypes = new Set<HynoePageType>(['local_business','service_provider','creator','community','digital_product','project_brand']);

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; category?: string }> }) {
  const params = await searchParams;
  const query = params.q ?? '';
  const pageType = params.type && pageTypes.has(params.type as HynoePageType) ? params.type as HynoePageType : undefined;
  const results = searchPages(flagshipPages, query, { pageType, category: params.category });

  return <main className="site-shell">
    <header className="topbar"><Link href="/" className="wordmark">HYNOE</Link><SearchForm defaultValue={query} /></header>
    <FilterBar query={query} activeType={pageType} />
    <section className="results-head">
      <div><div className="eyebrow">Hynoe Search</div><h1>{query.trim() ? `Results for “${query}”` : 'Discover on Hynoe'}</h1></div>
      <span>{results.length} {results.length === 1 ? 'result' : 'results'}</span>
    </section>
    {results.length ? <section className="results-grid">{results.map((result) => <ResultCard key={result.page.id} result={result} />)}</section>
      : <section className="empty-state"><h2>No matches yet.</h2><p>Try a broader search or explore what is already on Hynoe.</p><Link href="/search">Explore Hynoe</Link></section>}
  </main>;
}
