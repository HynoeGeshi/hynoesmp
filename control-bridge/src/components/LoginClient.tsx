'use client';

import { createClient } from '@supabase/supabase-js';
import { FormEvent, useMemo, useState } from 'react';
import { consentPageUrl } from '../auth/consent';

export function LoginClient({ supabaseUrl, supabasePublishableKey, authorizationId }: {
  supabaseUrl: string;
  supabasePublishableKey: string;
  authorizationId?: string;
}) {
  const supabase = useMemo(() => createClient(supabaseUrl, supabasePublishableKey), [supabaseUrl, supabasePublishableKey]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setBusy(false);
      return;
    }
    window.location.assign(authorizationId ? consentPageUrl(authorizationId) : '/');
  }

  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">Hynoe Control Bridge</p>
        <h1>Sign in to authorize ChatGPT</h1>
        <p className="muted">Only the owner account configured for this bridge can use Bloom or Discord tools.</p>
        <form onSubmit={submit} className="stack">
          <label>Email<input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Password<input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </section>
    </main>
  );
}
