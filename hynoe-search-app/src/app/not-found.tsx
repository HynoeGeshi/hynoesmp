import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
      <div>
        <p style={{ color: 'var(--gold-bright)', fontWeight: 800 }}>404</p>
        <h1>That Hynoe page does not exist.</h1>
        <Link href="/">Return to Hynoe Search</Link>
      </div>
    </main>
  );
}
