import Link from 'next/link';
import { SearchForm } from '@/components/search/search-form';
import { flagshipPages } from '@/data/flagship-pages';

export default function Home() {
  return <main className="home-shell">
    <section className="hero-section">
      <div aria-label="HYNOE" className="hero-wordmark">HYNOE</div>
      <h1>Find what&apos;s worth discovering.</h1>
      <p>Independent businesses, creators, communities, services, games, and projects — built to be found.</p>
      <SearchForm />
      <div className="quick-links"><Link href="/search?type=service_provider">Services</Link><Link href="/search?type=creator">Creators</Link><Link href="/search?type=community">Communities</Link><Link href="/search?type=digital_product">Games & Apps</Link></div>
    </section>
    <section className="originals-section"><div className="section-heading"><div><div className="eyebrow">Hynoe Originals</div><h2>See what can live on Hynoe.</h2></div><Link href="/search">Explore all</Link></div>
      <div className="originals-grid">{flagshipPages.map(page => <Link className="original-card" key={page.id} href={`/p/${page.slug}`}><span>{page.categories[0]}</span><h3>{page.name}</h3><p>{page.summary}</p></Link>)}</div>
    </section>
  </main>;
}
