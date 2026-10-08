import { Suspense } from 'react';
import Link from 'next/link';
import { HynoeWordmark } from '@/components/brand/hynoe-wordmark';
import { ReturningDiscovery } from '@/components/home/returning-discovery';
import { PublicDiscovery } from '@/components/home/public-discovery';
import { PublicDiscoverySection } from '@/components/home/public-discovery-section';
import { SearchForm } from '@/components/search/search-form';
import { flagshipPages } from '@/data/flagship-pages';

const categoryLinks = [
  ['Services', '/search?type=service_provider'],
  ['Creators', '/search?type=creator'],
  ['Communities', '/search?type=community'],
  ['Games & Apps', '/search?type=digital_product'],
  ['Local businesses', '/search?type=local_business'],
  ['Projects', '/search?type=project_brand'],
] as const;

const discoverySteps = [
  {
    number: '01',
    title: 'Discover',
    copy: 'Search independent people, businesses, creators, communities, services, and products in one structured network.',
  },
  {
    number: '02',
    title: 'Evaluate',
    copy: 'Understand what a Page offers through useful details, work samples, location, availability, and transparent platform signals.',
  },
  {
    number: '03',
    title: 'Connect',
    copy: 'Save, follow, visit, or send an inquiry without having to hunt across disconnected profiles and websites.',
  },
  {
    number: '04',
    title: 'Grow',
    copy: 'Owners improve their Page, visibility, leads, and operations from one Hynoe Command Center.',
  },
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
          <a href="#public-pages">Public pages</a>
          <a href="#how-hynoe-works">How it works</a>
          <a href="#originals">Originals</a>
          <Link className="nav-sign-in" href="/sign-in">Sign in</Link>
          <Link className="nav-create" href="/command-center/pages/new">Create a Page</Link>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-glow" data-decorative-motion aria-hidden="true" />
        <div className="hero-kicker"><span /> Independent-first discovery</div>
        <h1>Find what&apos;s worth <span>discovering.</span></h1>
        <p className="hero-copy">
          Independent people, businesses, creators, projects, communities, services, and products — organized so the right people can actually find them.
        </p>
        <div className="hero-search"><SearchForm /></div>
        <div className="quick-links" aria-label="Popular categories">
          {categoryLinks.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}
        </div>
        <div className="hero-principles" aria-label="Hynoe principles">
          <span>Independent-first</span>
          <span>Organic rank is earned</span>
          <span>Built for action, not vanity</span>
        </div>
      </section>

      <Suspense fallback={<PublicDiscoverySection pages={flagshipPages} loading />}>
        <PublicDiscovery />
      </Suspense>
      <ReturningDiscovery />

      <section className="how-section" id="how-hynoe-works">
        <div className="section-heading how-heading">
          <div>
            <div className="eyebrow">One discovery loop</div>
            <h2>How Hynoe works</h2>
            <p>Search is the front door. Hynoe Pages turn discovery into understanding, connection, and measurable growth.</p>
          </div>
          <Link className="section-link" href="/command-center/pages/new">Build your presence →</Link>
        </div>
        <div className="how-grid">
          {discoverySteps.map((step) => (
            <article className="how-card" key={step.number}>
              <div className="how-number">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="creatorops-section" id="creatorops">
        <div className="creatorops-copy">
          <div className="eyebrow">The operating layer</div>
          <h2>CreatorOps</h2>
          <p className="creatorops-tagline">You create. Hynoe runs the machine.</p>
          <p>
            CreatorOps is where Hynoe turns repeated creator work into a connected operating system for publishing, analytics, monetization, community, and growth.
          </p>
          <div className="creatorops-actions">
            <Link className="primary-cta" href="/command-center/pages/new">Create your Hynoe Page</Link>
            <Link className="secondary-cta" href="/search?type=creator">Explore creators</Link>
          </div>
        </div>
        <div className="creatorops-system" aria-hidden="true">
          <div className="system-core">HYNOE</div>
          <span className="system-node system-node-a">Publish</span>
          <span className="system-node system-node-b">Analyze</span>
          <span className="system-node system-node-c">Monetize</span>
          <span className="system-node system-node-d">Grow</span>
        </div>
      </section>

      <section className="originals-section" id="originals">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Built inside the network</div>
            <h2>Hynoe Originals</h2>
            <p>Real Hynoe products dogfooding the same discovery system we&apos;re building for everyone else.</p>
          </div>
          <Link className="section-link" href="/search">Explore all →</Link>
        </div>
        <div className="originals-grid">
          {flagshipPages.map((page, index) => (
            <Link className={`original-card original-card--${index + 1}`} key={page.id} href={`/p/${page.slug}`} aria-label={page.name}>
              <div className="original-card-top">
                <span>{page.categories[0]}</span>
                <span className="original-index">0{index + 1}</span>
              </div>
              <h3>{page.name}</h3>
              <p>{page.summary}</p>
              <strong className="card-cta">Open Hynoe Page <span>→</span></strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-final-cta">
        <div>
          <div className="eyebrow">Own your discovery layer</div>
          <h2>Build where people can actually find you.</h2>
          <p>Create a structured Hynoe Page, improve its Page Health, and turn discovery into real inquiries and opportunities.</p>
        </div>
        <div className="home-final-actions">
          <Link className="primary-cta" href="/command-center/pages/new">Create a Page</Link>
          <Link className="secondary-cta" href="/sign-in">Sign in</Link>
        </div>
      </section>
    </main>
  );
}
