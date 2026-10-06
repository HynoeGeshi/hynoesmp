(() => {
  const form = document.querySelector('#creator-audit-form');
  if (!form) return;

  const status = document.querySelector('#form-status');
  const panel = document.querySelector('#summary-panel');
  const summaryBox = document.querySelector('#application-summary');
  const copyButton = document.querySelector('#copy-summary');
  const clearButton = document.querySelector('#clear-draft');
  const DRAFT_KEY = 'hynoe.creatorops.auditDraft.v1';
  const intakeEndpoint = window.CREATOROPS_INTAKE_ENDPOINT || '';

  const fields = ['creatorName', 'email', 'primaryPlatform', 'profileUrl', 'goal', 'bottleneck', 'revenue', 'interest'];

  function getData() {
    return Object.fromEntries(fields.map((name) => [name, form.elements[name]?.value?.trim() || '']));
  }

  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(getData()));
  }

  function loadDraft() {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
      fields.forEach((name) => {
        if (saved[name] && form.elements[name]) form.elements[name].value = saved[name];
      });
    } catch (_) {
      localStorage.removeItem(DRAFT_KEY);
    }
  }

  function applicationSummary(data) {
    return [
      'Hynoe CreatorOps — Free Creator Audit application summary',
      '',
      `Creator: ${data.creatorName}`,
      `Email: ${data.email}`,
      `Primary platform: ${data.primaryPlatform}`,
      `Profile: ${data.profileUrl}`,
      `90-day goal: ${data.goal}`,
      `Biggest bottleneck: ${data.bottleneck}`,
      `Current creator revenue: ${data.revenue}`,
      `Interested in: ${data.interest}`,
      '',
      'Security reminder: no passwords, access tokens, API keys, or recovery codes are included in this application.'
    ].join('\n');
  }

  async function submitSecurely(data) {
    if (!intakeEndpoint) return false;
    const response = await fetch(intakeEndpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source: 'creatorops-audit', submittedAt: new Date().toISOString(), ...data })
    });
    if (!response.ok) throw new Error(`Intake request failed (${response.status})`);
    return true;
  }

  form.addEventListener('input', saveDraft);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = getData();
    const summary = applicationSummary(data);
    summaryBox.value = summary;
    panel.hidden = false;
    saveDraft();
    status.textContent = 'Application summary created.';

    try {
      const sent = await submitSecurely(data);
      if (sent) {
        status.textContent = 'Application received securely. We will use it for your Creator Audit.';
        localStorage.removeItem(DRAFT_KEY);
      } else {
        status.textContent = 'Application ready. Copy the summary below; secure direct intake will activate when the production endpoint is connected.';
      }
    } catch (error) {
      status.textContent = 'Your draft is safe in this browser, but the direct intake endpoint did not accept it. Copy the application summary below.';
      console.error(error);
    }
  });

  copyButton?.addEventListener('click', async () => {
    if (!summaryBox.value) return;
    try {
      await navigator.clipboard.writeText(summaryBox.value);
      status.textContent = 'Application summary copied.';
    } catch (_) {
      summaryBox.focus();
      summaryBox.select();
      document.execCommand('copy');
      status.textContent = 'Application summary copied.';
    }
  });

  clearButton?.addEventListener('click', () => {
    localStorage.removeItem(DRAFT_KEY);
    form.reset();
    panel.hidden = true;
    summaryBox.value = '';
    status.textContent = 'Draft cleared.';
  });

  loadDraft();
})();