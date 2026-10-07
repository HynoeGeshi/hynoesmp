import type { Metadata } from 'next';
import Link from 'next/link';
import { HynoeWordmark } from '@/components/brand/hynoe-wordmark';
import { SearchForm } from '@/components/search/search-form';
import { FilterBar } from '@/components/search/filter-bar';
import { MobileFilterPanel } from '@/components/search/mobile-filter-panel';
import { ResultCard } from '@/components/search/result-card';
import { searchPages } from '@/domain/search/search-pages';
import type { HynoePageType } from '@/domain/pages/types';
import { listDiscoverablePages } from '@/lib/pages/public-pages';
import styles from './search-page.module.css';

const pageTypes = new Set<HynoePageType>(['local_business','service_provider','creator','community','digital_product','project_brand']);

type SearchParams = { q?: string; type?: string; category?: string };
type Props = { searchParams: Promise<SearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q?.trim();

  return {
    title: query ? `${query} | Hynoe Search` : 'Explore | Hynoe Search',
    description: query
      ? `Discover Hynoe Pages relevant to ${query}.`
      : 'Explore independent businesses, creators, services, communities, games, and projects on Hynoe.',
    alternates: { canonical: 'https://hynoe.net/search' },
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q ?? '';
  const pageType = params.type && pageTypes.has(params.type as HynoePageType) ? params.type as HynoePageType : undefined;
  const discoverablePages = await listDiscoverablePages();
  const results = searchPages(discoverablePages, query, { pageType, category: params.category });

  return <main className="site-shell search-shell">
    <header className="topbar search-topbar">
      <Link href="/" className="home-brand-link" aria-label="Hynoe home"><HynoeWordmark /></Link>
      <SearchForm defaultValue={query} />
    </header>
    <div className={styles.desktopFilters}><FilterBar query={query} activeType={pageType} /></div>
    <MobileFilterPanel query={query} activeType={pageType} />
    <section className="results-head">
      <div><div className="eyebrow">Hynoe Search</div><h1>{query.trim() ? `Results for “${query}”` : 'Discover on Hynoe'}</h1></div>
      <span className={styles.count}>{results.length} {results.length === 1 ? 'result' : 'results'}</span>
    </section>
    {results.length ? <section className="results-grid">{results.map((result, index) => <ResultCard key={result.page.id} result={result} position={index + 1} />)}</section>
      : <section className="empty-state"><div className="eyebrow">Keep exploring</div><h2>No matches yet.</h2><p>Try a broader search or explore what is already on Hynoe.</p><Link className="secondary-cta" href="/search">Explore Hynoe</Link></section>}
  </main>;
}
