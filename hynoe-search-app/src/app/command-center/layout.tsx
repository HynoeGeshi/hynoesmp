import Link from 'next/link';
import type { ReactNode } from 'react';
import { HynoeWordmark } from '@/components/brand/hynoe-wordmark';
import { requireUser } from '@/lib/auth/require-user';

type CommandCenterLayoutProps = {
  children: ReactNode;
};

const NAV_ITEMS = [
  ['Overview', '/command-center'],
  ['My Page', '/command-center/my-page'],
  ['Inquiries', '/command-center/inquiries'],
  ['Search Visibility', '/command-center/search-visibility'],
  ['Activity', '/command-center/activity'],
  ['Settings', '/command-center/settings'],
] as const;

export default async function CommandCenterLayout({ children }: CommandCenterLayoutProps) {
  const user = await requireUser('/command-center');

  return (
    <div className="command-center-shell">
      <aside className="command-center-sidebar" aria-label="Command Center navigation">
        <Link href="/" className="command-center-brand" aria-label="Hynoe Search home">
          <HynoeWordmark />
        </Link>
        <div className="command-center-account">
          <span className="eyebrow">Command Center</span>
          <span>{user.email ?? 'Hynoe member'}</span>
        </div>
        <nav className="command-center-nav">
          {NAV_ITEMS.map(([label, href]) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
        </nav>
        <form action="/auth/sign-out" method="post" className="command-center-sign-out">
          <button type="submit">Sign out</button>
        </form>
      </aside>
      <main className="command-center-main">{children}</main>
    </div>
  );
}
