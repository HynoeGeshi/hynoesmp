import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { requireUser } from '@/lib/auth/require-user';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Command Center | Hynoe',
  description: 'Private Hynoe owner workspace.',
  robots: { index: false, follow: false },
};

export default async function CommandCenterLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <main style={{ minHeight: '100vh', padding: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <Link href="/" style={{ fontWeight: 800, textDecoration: 'none' }}>HYNOE</Link>
          <div style={{ opacity: 0.7, fontSize: 14 }}>Command Center</div>
        </div>
        <div style={{ fontSize: 14, opacity: 0.8 }}>{user.email}</div>
      </header>
      <nav aria-label="Command Center" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
        <Link href="/command-center" style={{ padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', textDecoration: 'none' }}>Your Pages</Link>
        <Link href="/command-center/inquiries" style={{ padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', textDecoration: 'none' }}>Inquiries</Link>
        <Link href="/search" style={{ padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', textDecoration: 'none' }}>Explore Search</Link>
      </nav>
      {children}
    </main>
  );
}
