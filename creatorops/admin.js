(() => {
  const root = document.querySelector('#applications');
  const statusEl = document.querySelector('#admin-status');
  const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

  function card(a) {
    return `<article class="admin-card">
      <div class="admin-card-head"><div><span class="eyebrow">${esc(a.status)}</span><h3>${esc(a.creator_name)}</h3></div><small>${esc(new Date(a.created_at).toLocaleString())}</small></div>
      <p><strong>${esc(a.primary_platform)}</strong> · <a href="${esc(a.profile_url)}" rel="noreferrer noopener" target="_blank">profile</a> · ${esc(a.email)}</p>
      <p><strong>Goal:</strong> ${esc(a.goal)}</p>
      <p><strong>Bottleneck:</strong> ${esc(a.bottleneck)}</p>
      <p><strong>Interest:</strong> ${esc(a.interest)} · <strong>Revenue:</strong> ${esc(a.revenue)}</p>
      <label>Status<select data-id="${esc(a.id)}"><option ${a.status === 'new' ? 'selected' : ''}>new</option><option ${a.status === 'reviewing' ? 'selected' : ''}>reviewing</option><option ${a.status === 'qualified' ? 'selected' : ''}>qualified</option><option ${a.status === 'contacted' ? 'selected' : ''}>contacted</option><option ${a.status === 'closed' ? 'selected' : ''}>closed</option></select></label>
    </article>`;
  }

  async function load() {
    statusEl.textContent = 'Loading…';
    const response = await fetch('/api/admin/applications', { credentials: 'same-origin', cache: 'no-store' });
    if (!response.ok) { statusEl.textContent = 'Unable to load applications.'; return; }
    const json = await response.json();
    const apps = json.applications || [];
    root.innerHTML = apps.map(card).join('') || '<p class="muted">No applications yet.</p>';
    root.querySelectorAll('select[data-id]').forEach((el) => el.addEventListener('change', async () => {
      const r = await fetch('/api/admin/status', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: el.dataset.id, status: el.value }) });
      statusEl.textContent = r.ok ? 'Status updated.' : 'Status update failed.';
    }));
    statusEl.textContent = `${apps.length} application(s)`;
  }

  document.querySelector('#refresh')?.addEventListener('click', load);
  load().catch(() => { statusEl.textContent = 'Admin data unavailable.'; });
})();