import Link from 'next/link';
import type { HynoePage } from '@/domain/pages/types';
import { ModuleRenderer } from './module-renderer';

export function PageShell({ page }: { page: HynoePage }) {
  return <main className="site-shell">
    <header className="topbar"><Link href="/" className="wordmark">HYNOE</Link><Link href="/search">Search</Link></header>
    <section className="profile-hero">
      <div className="eyebrow">{page.categories.join(' · ')}</div>
      <h1>{page.name}</h1><p>{page.description}</p>
      <a className="primary-cta" href={page.canonicalUrl} rel="noreferrer">Visit official destination</a>
    </section>
    <section className="module-stack">{page.modules.map((module, index) => <ModuleRenderer key={`${module.type}-${index}`} module={module} />)}</section>
  </main>;
}
