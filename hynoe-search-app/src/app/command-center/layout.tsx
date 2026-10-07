import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { HynoeWordmark } from '@/components/brand/hynoe-wordmark';
import { requireUser } from '@/lib/auth/require-user';
import styles from './command-center.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Command Center | Hynoe',
  description: 'Private Hynoe owner workspace.',
  robots: { index: false, follow: false },
};

export default async function CommandCenterLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <main className={styles.shell}>
      <div className={styles.frame}>
        <header className={styles.topbar}>
          <div className={styles.identity}>
            <Link href="/" aria-label="Hynoe home" className={styles.brand}><HynoeWordmark /></Link>
            <div className={styles.workspaceLabel}>
              <strong>Command Center</strong>
              <span>Owner workspace</span>
            </div>
          </div>
          <div className={styles.account}>
            <span className={styles.private}>Private</span>
            <span className={styles.email}>{user.email}</span>
          </div>
        </header>

        <div className={styles.workspace}>
          <aside className={styles.rail}>
            <p className={styles.railTitle}>Workspace</p>
            <nav aria-label="Command Center" className={styles.nav}>
              <Link href="/command-center">Your Pages</Link>
              <Link href="/command-center/inquiries">Inquiries</Link>
              <Link href="/search">Explore Search</Link>
              <Link href="/command-center/pages/new" className={styles.create}>Create Page</Link>
            </nav>
            <p className={styles.railNote}>Your owner tools are private. Published Hynoe Pages remain public and searchable.</p>
          </aside>
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </main>
  );
}
