/* Hynoe Growth Sprint: local planning tools, not account access or revenue forecasts. */
(function (root) {
  'use strict';
  function number(value, name, min, max) {
    if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '') throw new RangeError(name + ' is required.');
    const n = Number(value);
    if (!Number.isFinite(n) || n < min || n > max) throw new RangeError(name + ' must be between ' + min + ' and ' + max + '.');
    return n;
  }
  function calculate(input) {
    const target = Math.round(number(input.target, 'Target', 0, 1000000000) * 100);
    const price = Math.round(number(input.price, 'Price', 0.01, 10000000) * 100);
    const fees = Math.round(number(input.feePercent, 'Fees (%)', 0, 100) * 100);
    const reserve = Math.round(number(input.reservePercent, 'Reserve (%)', 0, 100) * 100);
    const conversion = Math.round(number(input.conversionPercent, 'Visit conversion (%)', 0.01, 100) * 100);
    const retained = 10000 - fees - reserve;
    if (retained <= 0) throw new RangeError('Fees and reserve together must be below 100%.');
    const grossBuyers = Math.ceil(target / price);
    const afterAllowanceBuyers = Math.ceil(target * 10000 / (price * retained));
    const grossVisits = Math.ceil(grossBuyers * 10000 / conversion);
    const afterAllowanceVisits = Math.ceil(afterAllowanceBuyers * 10000 / conversion);
    if (![grossBuyers, afterAllowanceBuyers, grossVisits, afterAllowanceVisits].every(Number.isSafeInteger)) throw new RangeError('This scenario exceeds the supported planning range.');
    return { grossBuyers, afterAllowanceBuyers, grossVisits, afterAllowanceVisits, retainedPerOrder: price * retained / 1000000, bankCash: null };
  }
  function trackingUrl(value, source, campaign, content) {
    let u;
    try { u = new URL(value); } catch { throw new Error('Enter an approved public HTTPS offer-page URL.'); }
    if (u.protocol !== 'https:' || u.username || u.password || u.hash || !u.hostname.includes('.') || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(u.hostname) || u.hostname.includes(':') || /(?:^|\.)(?:localhost|local|internal|test)$/.test(u.hostname)) throw new Error('Use a public HTTPS URL without credentials, fragments, or private addresses.');
    for (const key of u.searchParams.keys()) {
      if (/token|secret|session|auth|password|email|signature|api.?key|^code$|^key$/i.test(key)) throw new Error('Do not use private, login, or customer-specific links.');
    }
    for (const tag of [source, campaign, content]) {
      if (typeof tag !== 'string' || !/^[a-z0-9_-]{1,64}$/.test(tag)) throw new Error('Tracking labels use 1–64 lowercase letters, numbers, hyphens, or underscores; no personal identifiers.');
    }
    u.searchParams.set('utm_source', source);
    u.searchParams.set('utm_medium', 'organic_social');
    u.searchParams.set('utm_campaign', campaign);
    u.searchParams.set('utm_content', content);
    return u.toString();
  }
  const gates = ['ownerApproval', 'offerApproved', 'rightsCleared', 'checkoutVerified', 'deliveryConfirmed'];
  function readiness(input) {
    const missing = gates.filter(key => input[key] !== true);
    return { ready: missing.length === 0, missing };
  }
  root.HynoeGrowth = Object.freeze({ calculate, trackingUrl, readiness });
  if (typeof document === 'undefined') return;
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const count = new Intl.NumberFormat('en-US');
  const planner = document.querySelector('#growth-planner');
  const modelStatus = document.querySelector('#model-status');
  const modelOutput = document.querySelector('#model-output');
  function updateModel(event) {
    event?.preventDefault();
    try {
      const data = Object.fromEntries(['target', 'price', 'feePercent', 'reservePercent', 'conversionPercent'].map(key => [key, planner.elements[key].value]));
      const result = calculate(data);
      for (const key of ['grossBuyers', 'afterAllowanceBuyers', 'grossVisits', 'afterAllowanceVisits']) document.querySelector('#' + key).textContent = count.format(result[key]);
      document.querySelector('#retainedPerOrder').textContent = money.format(result.retainedPerOrder);
      modelOutput.hidden = false;
      modelStatus.textContent = 'Scenario updated. These are requirements under your assumptions, not predicted sales or bank deposits.';
    } catch (error) {
      modelOutput.hidden = true;
      modelStatus.textContent = error.message;
    }
  }
  planner?.addEventListener('submit', updateModel);
  if (planner) updateModel();
  const linkForm = document.querySelector('#tracking-form');
  linkForm?.addEventListener('submit', event => {
    event.preventDefault();
    const output = document.querySelector('#tracking-output');
    const status = document.querySelector('#tracking-status');
    try {
      output.value = trackingUrl(linkForm.elements.url.value.trim(), linkForm.elements.source.value, linkForm.elements.campaign.value.trim(), linkForm.elements.content.value.trim());
      status.textContent = 'Link prepared locally. Tags do not create analytics by themselves; verify your destination records them.';
    } catch (error) { output.value = ''; status.textContent = error.message; }
  });
  document.querySelector('#copy-link')?.addEventListener('click', async () => {
    const output = document.querySelector('#tracking-output');
    if (!output.value) return;
    try { await navigator.clipboard.writeText(output.value); document.querySelector('#tracking-status').textContent = 'Link copied. Test it before publishing.'; }
    catch { output.focus(); output.select(); document.querySelector('#tracking-status').textContent = 'Select and copy the prepared link.'; }
  });
  const checkForm = document.querySelector('#readiness-form');
  checkForm?.addEventListener('change', () => {
    const state = Object.fromEntries(gates.map(key => [key, checkForm.elements[key].checked]));
    const result = readiness(state);
    document.querySelector('#readiness-status').textContent = result.ready ? 'Planning checklist complete. This is not verified consent, account access, or permission to publish any specific post.' : result.missing.length + ' planning checks remain. Do not activate the offer until its owner approves.';
  });
})(globalThis);
