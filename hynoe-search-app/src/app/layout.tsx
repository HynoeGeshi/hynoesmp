import type { Metadata } from 'next';
import { PostHogProvider } from '@/lib/analytics/posthog-provider';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://hynoe.net'),
  title: 'Hynoe Search',
  description: 'Discover independent businesses, creators, services, communities, games, and projects on Hynoe.',
  icons: { icon: '/brand/hynoe-core-mark.png' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><PostHogProvider>{children}</PostHogProvider></body>
    </html>
  );
}
