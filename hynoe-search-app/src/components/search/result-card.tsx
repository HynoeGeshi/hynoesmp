'use client';

import Link from 'next/link';
import type { SearchResult } from '@/domain/search/types';
import { getPublicBusiness } from '@/data/public-businesses';
import { trackEvent } from '@/lib/analytics/track-event';
import styles from './result-card.module.css';

const pageTypeLabels = { local_business: 'Local business', service_provider: 'Service provider', creator: 'Creator', community: 'Community', digital_product: 'Digital product', project_brand: 'Project' } as const;

export function ResultCard({ result, position }: { result: SearchResult; position?: number }) {
  const { page } = result;
  const listing = getPublicBusiness(page.slug);
  const location = page.location?.onlineOnly ? 'Online' : page.location ? [page.location.city, page.location.region, page.location.country].filter(Boolean).join(', ') : '';
  const trackClick = () => trackEvent('search_result_clicked', { page_slug: page.slug, page_type: page.pageType, result_position: position ?? 0, source: 'search_results' });
  return <article className={`result-card ${styles.card}`}>
    <div className={`result-card__topline ${styles.topline}`}>
      <div className={`eyebrow ${styles.category}`}>{page.categories[0] ?? pageTypeLabels[page.pageType]}</div>
      <span className={`result-card__type ${styles.type}`}>{pageTypeLabels[page.pageType]}</span>
    </div>
    <h2 className={styles.title}><Link href={`/p/${page.slug}`} onClick={trackClick}>{page.name}</Link></h2>
    {listing ? <p className={styles.context}><strong>Public listing · unclaimed</strong><br />Not a Hynoe partner or endorsement.</p> : null}
    <p className={styles.summary}>{page.summary}</p>
    {location ? <p className={`result-location ${styles.context}`}>{location}</p> : null}
    {page.tags.length > 0 ? <div className={`tag-row ${styles.tags}`}>{page.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
    <div className={`result-card__footer ${styles.footer}`}>
      <Link className={`card-cta ${styles.cta}`} href={`/p/${page.slug}`} onClick={trackClick}>{listing ? 'View public listing' : 'View Hynoe Page'} <span className={styles.arrow} aria-hidden="true">→</span></Link>
      <span className={styles.hint}>{listing ? `Source: ${listing.checkedAt}` : 'Structured Hynoe Page'}</span>
    </div>
  </article>;
}
