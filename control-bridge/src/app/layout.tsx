import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hynoe Control Bridge',
  description: 'Private Bloom and Discord control bridge for Hynoe.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
