'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'react';
import { consentLoginUrl, normalizeAuthorizationId } from '../auth/consent';

export const CONTROL_PERMISSION_ITEMS = [
  'Approved Bloom server status, console, commands, files, backups, and power controls',
  'Owner-only guild-wide Discord inspection and management, including channels, roles, permissions, integrations, and bounded activity analysis',
  'Routine reversible Discord organization changes may run normally; high-impact moderation, deletion, member-content removal, and access broadening require explicit confirmation',
] as const;

type Details = {
  authorization_id: string;
  redirect_uri: string;
  client: { id: string; name: string; uri: string; logo_uri: string };
  user: { id: string; email: string };
  scope: string;
};

export function ConsentClient({ supabaseUrl, supabasePublishableKey, authorizationId }: {
  supabaseUrl: string;
  supabasePublishableKey: string;
  authorizationId: string;
}) {
  const id = normalizeAuthorizationId(authorizationId);
  const supabase = useMemo(() => createClient(supabaseUrl, supabasePublishableKey), [supabaseUrl, supabasePublishableKey]);
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!active) return;
      if (!sessionData.session) {
        window.location.assign(consentLoginUrl(id));
        return;
      }
      const { data, error: detailsError } = await supabase.auth.oauth.getAuthorizationDetails(id);
      if (!active) return;
      if (detailsError || !data) {
        setError(detailsError?.message ?? 'Unable to load authorization request.');
        return;
      }
      if ('redirect_url' in data) {
        window.location.assign(data.redirect_url);
        return;
      }
      setDetails(data as Details);
    })();
    return () => { active = false; };
  }, [id, supabase]);

  async function decide(action: 'approve' | 'deny') {
    setBusy(true);
    setError('');
    const response = action === 'approve'
      ? await supabase.auth.oauth.approveAuthorization(id, { skipBrowserRedirect: true })
      : await supabase.auth.oauth.denyAuthorization(id, { skipBrowserRedirect: true });
    if (response.error || !response.data) {
      setError(response.error?.message ?? `Unable to ${action} authorization.`);
      setBusy(false);
      return;
    }
    if ('redirect_url' in response.data) window.location.assign(response.data.redirect_url);
  }

  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">Hynoe Control Bridge</p>
        <h1>Authorize ChatGPT?</h1>
        {error && <p className="error" role="alert">{error}</p>}
        {!details && !error && <p className="muted">Loading authorization request…</p>}
        {details && (
          <div className="stack">
            <p><strong>{details.client.name || 'ChatGPT'}</strong> is requesting access to your private Hynoe Control Bridge.</p>
            <div className="permissionBox">
              <strong>What this owner-only connection can access</strong>
              <ul>{CONTROL_PERMISSION_ITEMS.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <p className="muted">Signed in as {details.user.email}. Requested OAuth scopes: {details.scope || 'openid email'}.</p>
            <div className="actions">
              <button type="button" className="secondary" disabled={busy} onClick={() => decide('deny')}>Deny</button>
              <button type="button" disabled={busy} onClick={() => decide('approve')}>{busy ? 'Working…' : 'Approve'}</button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
