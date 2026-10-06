import Link from 'next/link';
import { HynoeWordmark } from '@/components/brand/hynoe-wordmark';
import { SearchForm } from '@/components/search/search-form';
import { FilterBar } from '@/components/search/filter-bar';
import { MobileFilterPanel } from '@/components/search/mobile-filter-panel';
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

  return <main className="site-shell search-shell">
    <header className="topbar search-topbar">
      <Link href="/" className="home-brand-link" aria-label="Hynoe home"><HynoeWordmark /></Link>
      <SearchForm defaultValue={query} />
    </header>
    <div className="search-filter-desktop"><FilterBar query={query} activeType={pageType} /></div>
    <MobileFilterPanel query={query} activeType={pageType} />
    <section className="results-head">
      <div><div className="eyebrow">Hynoe Search</div><h1>{query.trim() ? `Results for “${query}”` : 'Discover on Hynoe'}</h1></div>
      <span className="results-count">{results.length} {results.length === 1 ? 'result' : 'results'}</span>
    </section>
    {results.length ? <section className="results-grid">{results.map((result) => <ResultCard key={result.page.id} result={result} />)}</section>
      : <section className="empty-state"><div className="eyebrow">Keep exploring</div><h2>No matches yet.</h2><p>Try a broader search or explore what is already on Hynoe.</p><Link className="secondary-cta" href="/search">Explore Hynoe</Link></section>}
  </main>;
}
