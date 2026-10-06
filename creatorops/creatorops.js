(() => {
  document.documentElement.classList.add('js');

  const diagnosticMap = {
    views: {
      code: '01 / PACKAGING',
      title: 'Make the next upload easier to understand and easier to choose.',
      copy: 'We would study the formats already holding attention, sharpen the promise before you publish, and build a repeatable packaging system around what your audience is already rewarding.'
    },
    overwhelmed: {
      code: '02 / OPERATIONS',
      title: 'Get the work out of your head and into one weekly operating rhythm.',
      copy: 'We would map the recurring creator work, remove duplicate steps, centralize the important decisions and automate the repeatable admin so creating stops competing with running the business.'
    },
    money: {
      code: '03 / MONETIZATION',
      title: 'Turn audience attention into a revenue path that actually fits the brand.',
      copy: 'We would map the offers your audience is most likely to value, strengthen sponsor readiness and build a simple path from content to action without turning every post into a sales pitch.'
    },
    consistency: {
      code: '04 / WORKFLOW',
      title: 'Build a publishing system that still works when motivation is not perfect.',
      copy: 'We would turn ideas, recording, packaging, publishing and repurposing into a repeatable cadence with clear next actions, so momentum comes from the system instead of memory.'
    }
  };

  const diagnosticButtons = [...document.querySelectorAll('[data-diagnostic]')];
  const diagnosticResult = document.querySelector('#diagnostic-result');
  const diagnosticTitle = document.querySelector('#diagnostic-title');
  const diagnosticCopy = document.querySelector('#diagnostic-copy');
  const diagnosticCode = diagnosticResult?.querySelector('.result-top b');

  function selectDiagnostic(key) {
    const result = diagnosticMap[key];
    if (!result || !diagnosticResult) return;
    diagnosticButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.diagnostic === key)));
    if (diagnosticTitle) diagnosticTitle.textContent = result.title;
    if (diagnosticCopy) diagnosticCopy.textContent = result.copy;
    if (diagnosticCode) diagnosticCode.textContent = result.code;
    diagnosticResult.classList.remove('result-pulse');
    requestAnimationFrame(() => diagnosticResult.classList.add('result-pulse'));
  }

  diagnosticButtons.forEach((button) => {
    button.addEventListener('click', () => selectDiagnostic(button.dataset.diagnostic));
  });

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const reveals = [...document.querySelectorAll('.reveal')];
  if (reducedMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((element) => element.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
    reveals.forEach((element) => revealObserver.observe(element));
  }

  const metricNodes = {
    views: document.querySelector('#metric-views'),
    subscribers: document.querySelector('#metric-subscribers'),
    watchHours: document.querySelector('#metric-watch-hours'),
    likes: document.querySelector('#metric-likes'),
    comments: document.querySelector('#metric-comments'),
    shares: document.querySelector('#metric-shares'),
    source: document.querySelector('#metric-source')
  };

  const integerFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
  const hourFormatter = new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 });

  function setMetric(node, value, formatter = integerFormatter) {
    if (!node) return;
    const number = Number(value);
    node.textContent = Number.isFinite(number) ? formatter.format(number) : '—';
  }

  function metricDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'date unavailable';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function clearProofMetrics(message = 'Verified metrics temporarily unavailable') {
    for (const node of [metricNodes.views, metricNodes.subscribers, metricNodes.watchHours, metricNodes.likes, metricNodes.comments, metricNodes.shares]) {
      if (node) node.textContent = '—';
    }
    if (metricNodes.source) metricNodes.source.textContent = message;
  }

  async function hydrateProofMetrics() {
    if (!metricNodes.source) return;
    try {
      const response = await fetch('/api/public/metrics/hynoe-youtube', { cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) throw new Error('metrics_unavailable');
      const payload = await response.json();
      const metrics = payload.metrics || {};
      setMetric(metricNodes.views, metrics.views_30d);
      setMetric(metricNodes.subscribers, metrics.subscribers);
      setMetric(metricNodes.likes, metrics.likes_30d);
      setMetric(metricNodes.comments, metrics.comments_30d);
      setMetric(metricNodes.shares, metrics.shares_30d);
      if (metricNodes.watchHours) {
        const hours = Number(metrics.watch_hours_30d);
        metricNodes.watchHours.textContent = Number.isFinite(hours) ? `~${hourFormatter.format(hours)}h` : '—';
      }

      const asOf = metricDate(payload.asOf);
      if (payload.freshness === 'stale_verified_snapshot') {
        metricNodes.source.textContent = `Last verified snapshot · as of ${asOf}`;
      } else if (payload.freshness === 'verified_snapshot') {
        metricNodes.source.textContent = `Verified snapshot · as of ${asOf}`;
      } else if (payload.freshness === 'fresh') {
        metricNodes.source.textContent = `Fresh verified snapshot · as of ${asOf}`;
      } else {
        metricNodes.source.textContent = `Verified snapshot · as of ${asOf}`;
      }
    } catch (_) {
      clearProofMetrics();
    }
  }

  hydrateProofMetrics();

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
    const strong = document.createElement('strong');
    strong.textContent = 'Prototype payment ready.';
    const copy = document.createElement('p');
    copy.textContent = 'This checkout is Stripe sandbox only — it cannot create a charge with real money.';
    const link = document.createElement('a');
    link.className = 'button primary';
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = interest.includes('499') ? 'Open $499 sandbox checkout' : 'Open $750/mo sandbox checkout';
    wrap.append(strong, copy, link);
    panel.append(wrap);
  }

  function showAuditResult(url) {
    document.querySelector('#audit-result-cta')?.remove();
    if (typeof url !== 'string' || !url.startsWith('/creatorops/report/')) throw new Error('invalid_report_url');
    const link = document.createElement('a');
    link.id = 'audit-result-cta';
    link.className = 'button primary wide';
    link.href = url;
    link.textContent = 'View my audit';
    panel.prepend(link);
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
      const result = await submitSecurely(data);
      if (!result?.report?.url) throw new Error('report_unavailable');
      showAuditResult(result.report.url);
      status.textContent = 'Your Starter Creator Audit is ready.';
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
    sessionStorage.removeItem(DRAFT_KEY);
    form.reset();
    honeypot.value = '';
    panel.hidden = true;
    summaryBox.value = '';
    document.querySelector('#audit-result-cta')?.remove();
    document.querySelector('#sandbox-checkout')?.remove();
    status.textContent = 'Draft cleared.';
  });

  const footer = document.querySelector('.site-footer');
  if (footer) {
    const legal = document.createElement('span');
    const privacy = document.createElement('a');
    privacy.href = '/creatorops/privacy.html';
    privacy.textContent = 'Privacy';
    privacy.className = 'legal-link';
    const terms = document.createElement('a');
    terms.href = '/creatorops/terms.html';
    terms.textContent = 'Terms';
    terms.className = 'legal-link';
    legal.append(privacy, document.createTextNode(' · '), terms);
    footer.append(legal);
  }

  loadDraft();
})();
