(() => {
  const form = document.querySelector('#creator-audit-form');
  if (!form) return;

  const status = document.querySelector('#form-status');
  const panel = document.querySelector('#summary-panel');
  const summaryBox = document.querySelector('#application-summary');
  const copyButton = document.querySelector('#copy-summary');
  const clearButton = document.querySelector('#clear-draft');
  const DRAFT_KEY = 'hynoe.creatorops.auditDraft.v3';
  const intakeEndpoint = '/api/intake';
  const CHECKOUTS = {
    '$499 Creator System Build': 'https://buy.stripe.com/test_aFa28t4Vc0qS2A66I19fW00',
    '$750/month Founding CreatorOps': 'https://buy.stripe.com/test_8x26oJ3R8a1sgqWc2l9fW01'
  };

  const honeypot = document.createElement('input');
  honeypot.type = 'text';
  honeypot.name = 'company';
  honeypot.tabIndex = -1;
  honeypot.autocomplete = 'off';
  honeypot.setAttribute('aria-hidden', 'true');
  honeypot.style.cssText = 'position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important';
  form.append(honeypot);

  const fields = ['creatorName', 'email', 'primaryPlatform', 'profileUrl', 'goal', 'bottleneck', 'revenue', 'interest'];

  function getData() {
    return Object.fromEntries(fields.map((name) => [name, form.elements[name]?.value?.trim() || '']));
  }

  function saveDraft() {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(getData()));
  }

  function loadDraft() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}');
      fields.forEach((name) => {
        if (saved[name] && form.elements[name]) form.elements[name].value = saved[name];
      });
    } catch (_) {
      sessionStorage.removeItem(DRAFT_KEY);
    }
  }

  function applicationSummary(data) {
    return [
      'Hynoe CreatorOps — Free Creator Audit application summary', '',
      `Creator: ${data.creatorName}`, `Email: ${data.email}`, `Primary platform: ${data.primaryPlatform}`,
      `Profile: ${data.profileUrl}`, `90-day goal: ${data.goal}`, `Biggest bottleneck: ${data.bottleneck}`,
      `Current creator revenue: ${data.revenue}`, `Interested in: ${data.interest}`, '',
      'Security reminder: no passwords, access tokens, API keys, or recovery codes are included in this application.'
    ].join('\n');
  }

  function showSandboxCheckout(interest) {
    document.querySelector('#sandbox-checkout')?.remove();
    const url = CHECKOUTS[interest];
    if (!url) return;
    const wrap = document.createElement('div');
    wrap.id = 'sandbox-checkout';
    wrap.className = 'security-note';
    wrap.innerHTML = '<strong>Prototype payment ready.</strong><p>This checkout is Stripe sandbox only — it cannot create a live charge.</p>';
    const link = document.createElement('a');
    link.className = 'button primary';
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = interest.includes('499') ? 'Open $499 sandbox checkout' : 'Open $750/mo sandbox checkout';
    wrap.append(link);
    panel.append(wrap);
  }

  async function submitSecurely(data) {
    const response = await fetch(intakeEndpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...data, company: honeypot.value || '' })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Intake request failed (${response.status})`);
    return result;
  }

  form.addEventListener('input', saveDraft);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = getData();
    summaryBox.value = applicationSummary(data);
    panel.hidden = false;
    saveDraft();
    status.textContent = 'Submitting securely…';
    try {
      await submitSecurely(data);
      status.textContent = 'Application received securely. Your Creator Audit is now in the review queue.';
      sessionStorage.removeItem(DRAFT_KEY);
      showSandboxCheckout(data.interest);
    } catch (error) {
      status.textContent = 'Your draft is still available in this tab. Secure intake is temporarily unavailable; copy the summary below.';
      console.error(error);
    }
  });

  copyButton?.addEventListener('click', async () => {
    if (!summaryBox.value) return;
    try { await navigator.clipboard.writeText(summaryBox.value); }
    catch { summaryBox.focus(); summaryBox.select(); document.execCommand('copy'); }
    status.textContent = 'Application summary copied.';
  });

  clearButton?.addEventListener('click', () => {
    sessionStorage.removeItem(DRAFT_KEY); form.reset(); honeypot.value = ''; panel.hidden = true; summaryBox.value = ''; status.textContent = 'Draft cleared.';
  });

  const footer = document.querySelector('.site-footer');
  if (footer) {
    const legal = document.createElement('span');
    const privacy = document.createElement('a');
    privacy.href = '/creatorops/privacy.html'; privacy.textContent = 'Privacy'; privacy.className = 'legal-link';
    const terms = document.createElement('a');
    terms.href = '/creatorops/terms.html'; terms.textContent = 'Terms'; terms.className = 'legal-link';
    legal.append(privacy, document.createTextNode(' · '), terms);
    footer.append(legal);
  }

  loadDraft();
})();