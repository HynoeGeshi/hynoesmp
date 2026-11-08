'use client';

import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { FormEvent, useMemo, useState } from 'react';
import { consentPageUrl } from '../auth/consent';

export function LoginClient({ supabaseUrl, supabasePublishableKey, authorizationId, client, onSignedIn, onCancel }: {
  supabaseUrl: string;
  supabasePublishableKey: string;
  authorizationId?: string;
  client?: SupabaseClient;
  onSignedIn?: (session: Session) => void;
  onCancel?: () => void;
}) {
  const supabase = useMemo(() => client ?? createClient(supabaseUrl, supabasePublishableKey), [client, supabaseUrl, supabasePublishableKey]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError || !data.session) {
        setError(signInError?.message ?? 'Sign-in did not create a session.');
        return;
      }
      if (onSignedIn) onSignedIn(data.session);
      else window.location.assign(authorizationId ? consentPageUrl(authorizationId) : '/');
    } catch {
      setError('Could not reach sign-in. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">Hynoe Control Bridge</p>
        <h1>{onSignedIn ? 'Sign in to review a Discord change' : 'Sign in to authorize ChatGPT'}</h1>
        <p className="muted">{onSignedIn ? 'Your draft is still open. Sign in as the Hynoe owner to preview it.' : 'Only the owner account configured for this bridge can use Bloom or Discord tools.'}</p>
        <form onSubmit={submit} className="stack">
          <label>Email<input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Password<input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          {onCancel && <button type="button" disabled={busy} onClick={onCancel}>Back to draft</button>}
        </form>
      </section>
    </main>
  );
}
