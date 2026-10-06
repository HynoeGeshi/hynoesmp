import Link from 'next/link';
import type { SearchResult } from '@/domain/search/types';

export function ResultCard({ result }: { result: SearchResult }) {
  const { page } = result;
  return (
    <article className="result-card">
      <div className="eyebrow">{page.categories[0] ?? page.pageType}</div>
      <h2><Link href={`/p/${page.slug}`}>{page.name}</Link></h2>
      <p>{page.summary}</p>
      <div className="tag-row">{page.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div>
      <Link className="card-cta" href={`/p/${page.slug}`}>View Hynoe Page</Link>
    </article>
  );
}
