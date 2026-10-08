import Link from 'next/link';
import type { HynoePage } from '@/domain/pages/types';
import { selectPublicDiscovery } from '@/domain/pages/public-discovery';
import { flagshipPages } from '@/data/flagship-pages';
import styles from './public-discovery.module.css';

const originalSlugs = new Set(flagshipPages.map((page) => page.slug));
const labels = {
  local_business: 'Local business', service_provider: 'Services', creator: 'Creator',
  community: 'Community', digital_product: 'Games & apps', project_brand: 'Project',
} as const;

function PublicPageCard({ page }: { page: HynoePage }) {
  const initials = page.name.trim().split(/\s+/).slice(0, 2)
    .map((word) => Array.from(word)[0]).join('').toUpperCase();
  const location = page.location?.onlineOnly ? 'Online' :
    [page.location?.city, page.location?.region].filter(Boolean).join(', ');

  return <article className={styles.card}>
    <Link href={`/p/${page.slug}`} className={styles.cardLink}
      aria-label={`Open ${page.name} public page`}>
      <div className={styles.cover} data-page-type={page.pageType} aria-hidden="true">
        <span className={styles.coverGrid} />
        <span className={styles.monogram}>{initials}</span>
        <span className={styles.coverType}>{labels[page.pageType]}</span>
        <span className={styles.arrow}>↗</span>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span>{page.categories[0] || labels[page.pageType]}</span>
          {originalSlugs.has(page.slug) ? <span className={styles.original}>Hynoe Original</span> : null}
        </div>
        <h3>{page.name}</h3>
        <p>{page.summary}</p>
        {location ? <span className={styles.location}>{location}</span> : null}
        <span className={styles.cardAction}>Explore Page <span aria-hidden="true">→</span></span>
      </div>
    </Link>
  </article>;
}

export function PublicDiscoverySection({ pages, loading = false }: {
  pages: readonly HynoePage[]; loading?: boolean;
}) {
  const { featured, community } = selectPublicDiscovery(pages);
  return <section className={styles.section} id="public-pages" aria-labelledby="public-pages-title">
    <header className={styles.heading}>
      <div>
        <div className="eyebrow">Independent work. Real destinations.</div>
        <h2 id="public-pages-title">Featured public pages</h2>
        <p>A starting point for discovering creators, services, communities, and things worth exploring.</p>
      </div>
      <Link className={styles.browse} href="/search">Browse all public Pages <span aria-hidden="true">→</span></Link>
    </header>
    {featured.length > 0 ? <div className={styles.grid}>
      {featured.map((page) => <PublicPageCard key={page.slug} page={page} />)}
    </div> : <p className={styles.note}>Explore public Pages through Search while the featured collection takes shape.</p>}
    <p className={styles.note}>Featured is an editorial selection, not verification or an endorsement. Hynoe-owned Pages are labeled.</p>

    <div className={styles.community} aria-labelledby="community-pages-title">
      <div className={styles.communityHeading}>
        <div><div className="eyebrow">Make room for independent work</div><h3 id="community-pages-title">From the community</h3></div>
        <Link className={styles.browse} href="/command-center/pages/new">Create a Page <span aria-hidden="true">↗</span></Link>
      </div>
      {loading ? <p className={styles.note} role="status">Loading community Pages…</p> :
        community.length > 0 ? <div className={styles.grid}>
          {community.map((page) => <PublicPageCard key={page.slug} page={page} />)}
        </div> : <div className={styles.empty}>
          <span className={styles.emptyMark} aria-hidden="true">+</span>
          <div><h4>Your work belongs here.</h4><p>Publish a Hynoe Page so people can find what you do. Drafts stay private; public Pages can appear in discovery.</p></div>
          <Link className={styles.browse} href="/search">Explore the network <span aria-hidden="true">→</span></Link>
        </div>}
    </div>
  </section>;
}
