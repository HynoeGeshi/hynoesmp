import Link from 'next/link';
import type { SearchResult } from '@/domain/search/types';

const pageTypeLabels = {
  local_business: 'Local business',
  service_provider: 'Service provider',
  creator: 'Creator',
  community: 'Community',
  digital_product: 'Digital product',
  project_brand: 'Project',
} as const;

export function ResultCard({ result }: { result: SearchResult }) {
  const { page } = result;
  const location = page.location
    ? [page.location.city, page.location.region, page.location.country].filter(Boolean).join(', ')
    : '';

  return (
    <article className="result-card">
      <div className="result-card__topline">
        <div className="eyebrow">{page.categories[0] ?? pageTypeLabels[page.pageType]}</div>
        <span className="result-card__type">{pageTypeLabels[page.pageType]}</span>
      </div>
      <h2><Link href={`/p/${page.slug}`}>{page.name}</Link></h2>
      <p>{page.summary}</p>
      {location ? <p className="result-location">{location}</p> : null}
      {page.tags.length > 0 ? (
        <div className="tag-row">
          {page.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}
        </div>
      ) : null}
      <div className="result-card__footer">
        <Link className="card-cta" href={`/p/${page.slug}`}>View Hynoe Page</Link>
      </div>
    </article>
  );
}
