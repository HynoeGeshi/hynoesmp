import Link from 'next/link';
import type { ReactNode } from 'react';
import { requireUser } from '@/lib/auth/require-user';

export const dynamic = 'force-dynamic';

export default async function CommandCenterLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <main style={{ minHeight: '100vh', padding: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 32 }}>
        <div>
          <Link href="/" style={{ fontWeight: 800, textDecoration: 'none' }}>HYNOE</Link>
          <div style={{ opacity: 0.7, fontSize: 14 }}>Command Center</div>
        </div>
        <div style={{ fontSize: 14, opacity: 0.8 }}>{user.email}</div>
      </header>
      {children}
    </main>
  );
}
