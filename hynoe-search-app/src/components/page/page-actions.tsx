import Link from 'next/link';
import styles from './page-shell.module.css';

export function PageActions({ canonicalUrl }: { canonicalUrl: string }) {
  return (
    <div className={styles.actions}>
      <a className="primary-cta" href={canonicalUrl} rel="noreferrer">Visit official destination</a>
      <Link className="secondary-cta" href="/search">Back to Search</Link>
    </div>
  );
}
