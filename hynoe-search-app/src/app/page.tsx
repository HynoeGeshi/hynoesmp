import Link from 'next/link';
import { HynoeWordmark } from '@/components/brand/hynoe-wordmark';
import { SearchForm } from '@/components/search/search-form';
import { flagshipPages } from '@/data/flagship-pages';

const categoryLinks = [
  ['Services', '/search?type=service_provider'],
  ['Creators', '/search?type=creator'],
  ['Communities', '/search?type=community'],
  ['Games & Apps', '/search?type=digital_product'],
] as const;

export default function Home() {
  return (
    <main className="home-shell">
      <header className="home-header">
        <Link href="/" aria-label="Hynoe home" className="home-brand-link">
          <HynoeWordmark />
        </Link>
        <nav className="home-nav" aria-label="Primary navigation">
          <Link href="/search">Explore</Link>
          <a href="#creatorops">CreatorOps</a>
          <a href="#originals">Hynoe Originals</a>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-glow" data-decorative-motion aria-hidden="true" />
        <div className="eyebrow">The discovery layer for independent work</div>
        <h1>Find what&apos;s worth discovering.</h1>
        <p className="hero-copy">
          Independent people, businesses, creators, projects, communities, services, and products — organized so the right people can actually find them.
        </p>
        <div className="hero-search"><SearchForm /></div>
        <div className="quick-links" aria-label="Popular categories">
          {categoryLinks.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}
        </div>
      </section>

      <section className="creatorops-section" id="creatorops">
        <div className="creatorops-copy">
          <div className="eyebrow">Hynoe vertical</div>
          <h2>CreatorOps</h2>
          <p className="creatorops-tagline">You create. Hynoe runs the machine.</p>
          <p>
            A creator-focused layer for discovery, operations, publishing, analytics, monetization, and the repetitive work that slows creators down.
          </p>
          <Link className="secondary-cta" href="/search?type=creator">Explore creators</Link>
        </div>
        <div className="creatorops-orbit" aria-hidden="true">
          <span>Publish</span><span>Analyze</span><span>Monetize</span><span>Grow</span>
        </div>
      </section>

      <section className="originals-section" id="originals">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Built inside the network</div>
            <h2>Hynoe Originals</h2>
            <p>Real Hynoe products showing what the platform can surface.</p>
          </div>
          <Link href="/search">Explore all</Link>
        </div>
        <div className="originals-grid">
          {flagshipPages.map((page) => (
            <Link className="original-card" key={page.id} href={`/p/${page.slug}`} aria-label={page.name}>
              <span>{page.categories[0]}</span>
              <h3>{page.name}</h3>
              <p>{page.summary}</p>
              <strong className="card-cta">Open page →</strong>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
