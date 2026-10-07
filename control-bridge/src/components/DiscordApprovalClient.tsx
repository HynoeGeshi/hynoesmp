'use client';
import { createClient } from '@supabase/supabase-js';
import { useMemo, useState } from 'react';

export function DiscordApprovalClient({ supabaseUrl, supabasePublishableKey }: { supabaseUrl: string; supabasePublishableKey: string }) {
  const supabase = useMemo(() => createClient(supabaseUrl, supabasePublishableKey), [supabaseUrl, supabasePublishableKey]);
  const [tool, setTool] = useState('discord_delete_channel');
  const [input, setInput] = useState('{"channelId":""}');
  const [preview, setPreview] = useState<{ digest: string; input: unknown; tool: string; guildId: string; requiresApproval: boolean }>();
  const [receipt, setReceipt] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(approve: boolean) {
    setBusy(true); setError(''); setReceipt('');
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { window.location.assign('/login'); return; }
      const response = await fetch('/api/discord/approval', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify({ tool, input: JSON.parse(input), approve, digest: approve ? preview?.digest : undefined }) });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error);
      if (approve) setReceipt(value.approvalId); else setPreview(value);
    } catch (e) { setError(e instanceof Error ? e.message : 'Request failed'); }
    finally { setBusy(false); }
  }
  return <main className="shell"><section className="card stack"><p className="eyebrow">Hynoe Control</p><h1>Review a Discord change</h1><p>Preview the exact action. Approval expires in five minutes and can be used once. This page never performs the change itself.</p>
    <label>Action<input value={tool} onChange={e => { setTool(e.target.value); setPreview(undefined); setReceipt(''); }} /></label>
    <label>Action details<textarea rows={8} value={input} onChange={e => { setInput(e.target.value); setPreview(undefined); setReceipt(''); }} /></label>
    <button disabled={busy} onClick={() => submit(false)}>Preview change</button>
    {preview && <><p>Server: {preview.guildId}. Action: {preview.tool}.</p><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(preview.input, null, 2)}</pre><button disabled={busy} onClick={() => submit(true)}>Approve this exact change</button></>}
    {receipt && <label>One-use approval ID<input readOnly value={receipt} /><span>Give this ID to the authorized tool together with the unchanged action details.</span></label>}
    {error && <p role="alert">{error}</p>}
  </section></main>;
}
