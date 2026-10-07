import type { Metadata } from 'next';
import Link from 'next/link';
import { HynoeWordmark } from '@/components/brand/hynoe-wordmark';
import { requestMagicLink } from './actions';
import styles from './sign-in.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign in | Hynoe',
  description: 'Secure passwordless access to the Hynoe Command Center.',
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ sent?: string; error?: string }> };

export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;
  const sent = params.sent === '1';
  const error = params.error;

  return (
    <main className={styles.shell}>
      <section className={styles.frame}>
        <aside className={styles.context}>
          <Link href="/" aria-label="Hynoe home" className={styles.brand}>
            <HynoeWordmark />
          </Link>
          <div className={styles.contextCopy}>
            <div className={styles.eyebrow}>Your operating layer</div>
            <h2>Discovery is better when you can act on it.</h2>
            <p>Hynoe turns your public Page, search visibility, inquiries, and CreatorOps workflow into one connected owner workspace.</p>
            <div className={styles.benefits} aria-label="Command Center capabilities">
              <div className={styles.benefit}><span className={styles.dot} />Manage Hynoe Pages</div>
              <div className={styles.benefit}><span className={styles.dot} />Improve Page Health</div>
              <div className={styles.benefit}><span className={styles.dot} />Review inquiries</div>
              <div className={styles.benefit}><span className={styles.dot} />Track discovery</div>
            </div>
          </div>
          <p className={styles.footnote}>HYNOE · Independent-first discovery and operations.</p>
        </aside>

        <div className={styles.panel}>
          <div className={styles.panelTop}>
            <Link href="/" className={styles.backLink}>← Back to Search</Link>
            <span className={styles.secureLabel}>Secure passwordless access</span>
          </div>
          <h1>Sign in to Hynoe</h1>
          <p className={styles.intro}>Manage your Hynoe Page, visibility, inquiries, and CreatorOps tools from one Command Center.</p>
          <div className={styles.passwordless}>
            <span aria-hidden="true">✦</span>
            <span><strong>No password needed.</strong> Enter your email and Hynoe will send a secure one-time sign-in link.</span>
          </div>
          {sent ? <p role="status" className={styles.status}>Check your email for your secure Hynoe sign-in link.</p> : null}
          {error ? <p role="alert" className={styles.error}>We could not start sign-in. Check the email and try again.</p> : null}
          <form action={requestMagicLink} className={styles.form}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required maxLength={320} placeholder="you@example.com" />
            <button type="submit">Email me a sign-in link</button>
          </form>
          <p className={styles.finePrint}>Use the email connected to your Hynoe account or Page ownership. Sign-in links expire and should not be forwarded.</p>
        </div>
      </section>
    </main>
  );
}
