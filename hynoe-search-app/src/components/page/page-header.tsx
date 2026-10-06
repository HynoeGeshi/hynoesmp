import Link from 'next/link';
import { HynoeWordmark } from '@/components/brand/hynoe-wordmark';
import styles from './page-shell.module.css';

export function PageHeader() {
  return (
    <header className={styles.siteHeader}>
      <Link href="/" className={styles.brandLink} aria-label="Hynoe home">
        <HynoeWordmark />
      </Link>
      <nav className={styles.siteNav} aria-label="Hynoe Page navigation">
        <Link href="/search">Search</Link>
      </nav>
    </header>
  );
}
