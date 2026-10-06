import Link from 'next/link';
import { requestMagicLink } from './actions';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ sent?: string; error?: string }> };

export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;
  const sent = params.sent === '1';
  const error = params.error;

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <section style={{ width: 'min(460px, 100%)', padding: 28, border: '1px solid rgba(255,255,255,.12)', borderRadius: 24, background: 'rgba(255,255,255,.04)' }}>
        <Link href="/" style={{ textDecoration: 'none', fontWeight: 900, letterSpacing: '.08em' }}>HYNOE</Link>
        <h1 style={{ marginTop: 24 }}>Sign in to Hynoe</h1>
        <p style={{ opacity: 0.72, lineHeight: 1.6 }}>Manage your Hynoe Page, visibility, inquiries, and CreatorOps tools from one Command Center.</p>
        {sent ? (
          <p role="status" style={{ padding: 14, borderRadius: 14, background: 'rgba(212,175,55,.12)' }}>Check your email for your secure Hynoe sign-in link.</p>
        ) : null}
        {error ? (
          <p role="alert" style={{ padding: 14, borderRadius: 14, background: 'rgba(255,80,80,.12)' }}>We could not start sign-in. Check the email and try again.</p>
        ) : null}
        <form action={requestMagicLink} style={{ display: 'grid', gap: 12, marginTop: 20 }}>
          <label htmlFor="email" style={{ fontWeight: 700 }}>Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required maxLength={320} placeholder="you@example.com" style={{ padding: '14px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,.16)', background: 'rgba(0,0,0,.22)', color: 'inherit' }} />
          <button type="submit" style={{ padding: '14px 18px', borderRadius: 14, border: 0, fontWeight: 800, cursor: 'pointer' }}>Email me a sign-in link</button>
        </form>
      </section>
    </main>
  );
}
