import type { Metadata } from 'next';
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
      <body>{children}</body>
    </html>
  );
}
