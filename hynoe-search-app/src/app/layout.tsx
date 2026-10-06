import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hynoe Search',
  description: 'Discover independent businesses, creators, services, communities, games, and projects on Hynoe.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
