(() => {
  const loading = document.querySelector('#report-loading');
  const error = document.querySelector('#report-error');
  const content = document.querySelector('#report-content');

  function setText(selector, value) {
    const node = document.querySelector(selector);
    if (node) node.textContent = String(value ?? '');
  }

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  }

  function renderActions(actions) {
    const root = document.querySelector('#priority-actions');
    if (!root) return;
    const nodes = (actions || []).slice(0, 3).map((action) => {
      const article = make('article', 'report-action');
      article.append(make('span', 'report-action-rank', String(action.rank).padStart(2, '0')));
      article.append(make('h3', '', action.title));
      article.append(make('p', '', action.reason));
      const next = make('div', 'report-next-step');
      next.append(make('small', '', 'Next step'));
      next.append(make('strong', '', action.next_step));
      article.append(next);
      return article;
    });
    root.replaceChildren(...nodes);
  }

  function renderWeek(days) {
    const root = document.querySelector('#seven-day-plan');
    if (!root) return;
    const nodes = (days || []).slice(0, 7).map((item) => {
      const row = make('article', 'report-day');
      row.append(make('span', '', `DAY ${item.day}`));
      row.append(make('p', '', item.action));
      return row;
    });
    root.replaceChildren(...nodes);
  }

  function renderList(selector, items) {
    const root = document.querySelector(selector);
    if (!root) return;
    root.replaceChildren(...(items || []).map((item) => make('li', '', item)));
  }

  function showError() {
    if (loading) loading.hidden = true;
    if (content) content.hidden = true;
    if (error) error.hidden = false;
  }

  async function load() {
    const token = location.pathname.split('/').filter(Boolean).pop() || '';
    if (!/^[A-Za-z0-9_-]{43,128}$/.test(token)) return showError();
    const response = await fetch(`/api/report/${encodeURIComponent(token)}`, { cache: 'no-store', credentials: 'omit' });
    if (!response.ok) return showError();
    const payload = await response.json();
    const report = payload.report;
    if (!report || report.version !== 1) return showError();

    setText('#report-platform', `${report.creator?.primary_platform || 'Creator'} · private starter audit`);
    setText('#report-name', report.creator?.display_name || 'Your creator audit');
    setText('#report-summary', report.summary);
    setText('#bottleneck-label', report.primary_bottleneck?.label);
    setText('#bottleneck-why', report.primary_bottleneck?.why_it_matters);
    const expiry = payload.expiresAt ? new Date(payload.expiresAt) : null;
    setText('#report-expiry', expiry && !Number.isNaN(expiry.getTime()) ? `Private link expires ${expiry.toLocaleDateString()}` : 'Private report');
    renderActions(report.priority_actions);
    renderWeek(report.seven_day_plan);
    setText('#money-title', report.monetization_opportunity?.title);
    setText('#money-copy', report.monetization_opportunity?.explanation);
    renderList('#creatorops-handles', report.creatorops_can_handle);
    setText('#offer-title', report.recommended_offer?.title);
    setText('#offer-reason', report.recommended_offer?.reason);
    renderList('#limitations', report.limitations);

    if (loading) loading.hidden = true;
    if (error) error.hidden = true;
    if (content) content.hidden = false;
  }

  load().catch(showError);
})();
