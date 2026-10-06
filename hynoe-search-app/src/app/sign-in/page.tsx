import Link from 'next/link';
import { HynoeWordmark } from '@/components/brand/hynoe-wordmark';
import { sanitizeAuthReturnPath } from '@/lib/auth/return-path';

type SignInSearchParams = {
  next?: string | string[];
  sent?: string | string[];
  error?: string | string[];
};

type SignInPageProps = {
  searchParams?: Promise<SignInSearchParams>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = searchParams ? await searchParams : {};
  const returnPath = sanitizeAuthReturnPath(first(params.next));
  const sent = first(params.sent) === '1';
  const invalidLink = first(params.error) === 'invalid-link';

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="sign-in-title">
        <Link href="/" className="auth-brand" aria-label="Hynoe Search home">
          <HynoeWordmark />
        </Link>
        <div className="auth-copy">
          <p className="eyebrow">Your Hynoe account</p>
          <h1 id="sign-in-title">Sign in to Hynoe</h1>
          <p>Use your email to securely access your Hynoe Pages and Command Center. No password required.</p>
        </div>

        {sent && (
          <p className="auth-message auth-message--success" role="status">
            Check your email for your secure Hynoe sign-in link.
          </p>
        )}
        {invalidLink && (
          <p className="auth-message auth-message--error" role="alert">
            That sign-in link is invalid or expired. Request a new one below.
          </p>
        )}

        <form className="auth-form" action="/auth/request-link" method="post">
          <input type="hidden" name="next" value={returnPath} />
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
          <button type="submit">Email me a sign-in link</button>
        </form>

        <p className="auth-footnote">
          Hynoe Search stays open to everyone. Signing in is only needed to manage your Pages and private activity.
        </p>
      </section>
    </main>
  );
}
