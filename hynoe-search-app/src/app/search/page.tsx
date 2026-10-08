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
import { getPublicBusiness } from '@/data/public-businesses';
import styles from './search-page.module.css';

const pageTypes = new Set<HynoePageType>(['local_business','service_provider','creator','community','digital_product','project_brand']);
type SearchParams = { q?: string | string[]; type?: string | string[]; category?: string | string[]; scope?: string | string[] };
type Props = { searchParams: Promise<SearchParams> };
function text(value: string | string[] | undefined, length = 200): string { return (Array.isArray(value) ? value[0] || '' : value || '').trim().slice(0, length); }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const query = text(params.q);
  return { title: query ? `${query} | Hynoe Search` : 'Explore | Hynoe Search', description: query ? `Discover Hynoe Pages relevant to ${query}.` : 'Explore Hynoe pages and sourced public business listings.', alternates: { canonical: 'https://hynoe.net/search' }, robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = text(params.q);
  const type = text(params.type, 50);
  const pageType = pageTypes.has(type as HynoePageType) ? type as HynoePageType : undefined;
  const directoryOnly = text(params.scope, 30) === 'directory';
  const allPages = await listDiscoverablePages();
  const pages = directoryOnly ? allPages.filter((page) => Boolean(getPublicBusiness(page.slug))) : allPages;
  const results = searchPages(pages, query, { pageType, category: text(params.category, 120) || undefined });
  return <main className={`site-shell search-shell ${styles.shell}`}>
    <header className={`topbar search-topbar ${styles.topbar}`}><Link href="/preview" className="home-brand-link" aria-label="Hynoe home"><HynoeWordmark /></Link><SearchForm defaultValue={query} /></header>
    <nav aria-label="Discovery scope" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 22px', fontSize: 14, padding: '16px 0' }}><Link href="/preview">← Hynoe home</Link><Link href="/search">All pages</Link><Link href="/search?scope=directory">Public business directory</Link><Link href="/listing-policy">How listings work</Link></nav>
    <div className={styles.desktopFilters}><FilterBar query={query} activeType={pageType} /></div><MobileFilterPanel query={query} activeType={pageType} />
    <section className={styles.resultsHead}><div><div className="eyebrow">Hynoe Search</div><h1>{query ? `Results for “${query}”` : directoryOnly ? 'Public business directory' : 'Discover on Hynoe'}</h1></div><span className={styles.count}>{results.length} {results.length === 1 ? 'result' : 'results'}</span></section>
    {directoryOnly || results.some((result) => Boolean(getPublicBusiness(result.page.slug))) ? <aside style={{ border: '1px solid #d4c9b3', background: '#f2ecdf', color: '#4c402c', borderRadius: 12, padding: '16px 20px', marginBottom: 22, fontSize: 14, lineHeight: 1.8 }}><strong>Public listings are not partnerships.</strong> Outside businesses are marked unclaimed with a source date. Inclusion is not approval or endorsement. <Link href="/listing-policy#corrections" style={{ textDecoration: 'underline' }}>Corrections and removal requests</Link>.</aside> : null}
    {results.length ? <section className={styles.grid}>{results.map((result, index) => <ResultCard key={result.page.id} result={result} position={index + 1} />)}</section> : <section className={styles.empty}><div className="eyebrow">Keep exploring</div><h2>No matches yet.</h2><p>Try a broader search or another category. No result does not mean a business is closed.</p><Link className="secondary-cta" href="/search">Explore all Hynoe pages</Link></section>}
  </main>;
}
