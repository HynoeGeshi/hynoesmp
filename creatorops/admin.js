(() => {
  const root = document.querySelector('#applications');
  const paymentsRoot = document.querySelector('#payments');
  const statusEl = document.querySelector('#admin-status');
  const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

  function auditMeta(a) {
    const status = a.audit_status || 'missing';
    const expires = a.audit_expires_at ? new Date(a.audit_expires_at) : null;
    const expiryText = expires && !Number.isNaN(expires.getTime()) ? ` · expires ${expires.toLocaleDateString()}` : '';
    return `<p class="admin-audit-meta"><strong>Starter audit:</strong> ${esc(status)}${esc(expiryText)}</p>`;
  }

  function card(a) {
    return `<article class="admin-card">
      <div class="admin-card-head"><div><span class="eyebrow">${esc(a.status)}</span><h3>${esc(a.creator_name)}</h3></div><small>${esc(new Date(a.created_at).toLocaleString())}</small></div>
      <p><strong>${esc(a.primary_platform)}</strong> · <a href="${esc(a.profile_url)}" rel="noreferrer noopener" target="_blank">profile</a> · ${esc(a.email)}</p>
      <p><strong>Goal:</strong> ${esc(a.goal)}</p>
      <p><strong>Bottleneck:</strong> ${esc(a.bottleneck)}</p>
      <p><strong>Interest:</strong> ${esc(a.interest)} · <strong>Revenue:</strong> ${esc(a.revenue)}</p>
      ${auditMeta(a)}
      <label>Status<select data-id="${esc(a.id)}"><option ${a.status === 'new' ? 'selected' : ''}>new</option><option ${a.status === 'reviewing' ? 'selected' : ''}>reviewing</option><option ${a.status === 'qualified' ? 'selected' : ''}>qualified</option><option ${a.status === 'contacted' ? 'selected' : ''}>contacted</option><option ${a.status === 'closed' ? 'selected' : ''}>closed</option></select></label>
    </article>`;
  }

  function paymentCard(p) {
    const amount = Number.isFinite(Number(p.amount_total)) ? `${(Number(p.amount_total) / 100).toFixed(2)} ${(p.currency || '').toUpperCase()}` : 'Amount unavailable';
    return `<article class="admin-card"><div class="admin-card-head"><div><span class="eyebrow">${esc(p.payment_status || p.event_type)}</span><h3>${esc(p.product)}</h3></div><small>${esc(new Date(p.created_at).toLocaleString())}</small></div><p><strong>${esc(amount)}</strong></p><p>Event: ${esc(p.event_type)}</p><p>Session: ${esc(p.stripe_session_id || '—')}</p><p>Subscription: ${esc(p.stripe_subscription_id || '—')}</p></article>`;
  }

  async function load() {
    statusEl.textContent = 'Loading…';
    const [appsResponse, paymentsResponse] = await Promise.all([
      fetch('/api/admin/applications', { credentials: 'same-origin', cache: 'no-store' }),
      fetch('/api/admin/payments', { credentials: 'same-origin', cache: 'no-store' })
    ]);
    if (!appsResponse.ok || !paymentsResponse.ok) { statusEl.textContent = 'Unable to load the full dashboard.'; return; }
    const [appsJson, paymentsJson] = await Promise.all([appsResponse.json(), paymentsResponse.json()]);
    const apps = appsJson.applications || [];
    const payments = paymentsJson.payments || [];
    root.innerHTML = apps.map(card).join('') || '<p class="muted">No applications yet.</p>';
    paymentsRoot.innerHTML = payments.map(paymentCard).join('') || '<p class="muted">No payment events yet.</p>';
    root.querySelectorAll('select[data-id]').forEach((el) => el.addEventListener('change', async () => {
      const r = await fetch('/api/admin/status', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: el.dataset.id, status: el.value }) });
      statusEl.textContent = r.ok ? 'Status updated.' : 'Status update failed.';
    }));
    statusEl.textContent = `${apps.length} application(s) · ${payments.length} payment event(s)`;
  }

  document.querySelector('#refresh')?.addEventListener('click', load);
  load().catch(() => { statusEl.textContent = 'Admin data unavailable.'; });
})();