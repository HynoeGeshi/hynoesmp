'use client';
import { createClient } from '@supabase/supabase-js';
import { useMemo, useState } from 'react';
import { LoginClient } from './LoginClient';

type Target = { id: string; name: string };
type Preview = {
  digest: string;
  input: Record<string, unknown>;
  tool: string;
  guildId: string;
  requiresApproval: boolean;
  channels: Target[];
  roles: Target[];
};

export function DiscordApprovalClient({ supabaseUrl, supabasePublishableKey }: { supabaseUrl: string; supabasePublishableKey: string }) {
  const supabase = useMemo(() => createClient(supabaseUrl, supabasePublishableKey), [supabaseUrl, supabasePublishableKey]);
  const [tool, setTool] = useState('discord_delete_channel');
  const [input, setInput] = useState('{"channelId":""}');
  const [preview, setPreview] = useState<Preview>();
  const [receipt, setReceipt] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  function resetReview() {
    setPreview(undefined);
    setReceipt('');
    setError('');
  }

  function requireSignIn() {
    resetReview();
    setSigningIn(true);
  }

  async function submit(approve: boolean, signedInToken?: string) {
    if (busy || (approve && !preview?.requiresApproval)) return;
    let details: unknown;
    try {
      details = JSON.parse(input);
    } catch {
      setError('Enter valid JSON for the action details.');
      return;
    }
    if (!details || typeof details !== 'object' || Array.isArray(details)) {
      setError('Enter the action details as a JSON object.');
      return;
    }
    if (!approve) resetReview();
    setBusy(true);
    try {
      const token = signedInToken ?? (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        requireSignIn();
        return;
      }
      const response = await fetch('/api/discord/approval', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ tool, input: details, approve, digest: approve ? preview?.digest : undefined }),
      });
      if (response.status === 401) {
        requireSignIn();
        return;
      }
      if (response.status === 409) resetReview();
      const value = await response.json().catch(() => null);
      if (!response.ok || !value) throw new Error(value?.error ?? 'Could not review the change. Try again.');
      setError('');
      if (approve) setReceipt(value.approvalId);
      else setPreview(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not review the change. Try again.');
    } finally {
      setBusy(false);
    }
  }

  if (signingIn) {
    return <LoginClient supabaseUrl={supabaseUrl} supabasePublishableKey={supabasePublishableKey} client={supabase}
      onCancel={() => setSigningIn(false)}
      onSignedIn={session => {
        setSigningIn(false);
        // A fresh preview must be reviewed after reauthentication.
        void submit(false, session.access_token);
      }}
    />;
  }

  const channel = preview?.channels.find(target => target.id === preview.input.channelId);
  const role = preview?.roles.find(target => target.id === preview.input.roleId);
  return (
    <main className="shell">
      <section className="card stack">
        <p className="eyebrow">Hynoe Control</p>
        <h1>Review a Discord change</h1>
        <p>Preview the exact action. Approval expires in five minutes and can be used once. The authorized tool carries out the approved change.</p>
        <label>Action<input value={tool} disabled={busy} onChange={e => { setTool(e.target.value); resetReview(); }} /></label>
        <label>Action details<textarea rows={8} value={input} disabled={busy} onChange={e => { setInput(e.target.value); resetReview(); }} /></label>
        <button disabled={busy} onClick={() => submit(false)}>{busy ? 'Reviewing…' : 'Preview change'}</button>
        {preview && <>
          <p>Server {preview.guildId} · {preview.tool}</p>
          {channel && <p>Channel · {channel.name}</p>}
          {role && <p>Role · {role.name}</p>}
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(preview.input, null, 2)}</pre>
          {preview.requiresApproval
            ? <button disabled={busy || Boolean(receipt)} onClick={() => submit(true)}>Approve this exact change</button>
            : <p>This action does not require owner approval.</p>}
        </>}
        {receipt && <label>One-use approval ID<input readOnly value={receipt} /><span>Give this ID to the authorized tool together with the unchanged action details.</span></label>}
        {error && <p role="alert">{error}</p>}
      </section>
    </main>
  );
}
