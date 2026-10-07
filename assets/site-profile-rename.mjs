import {
  createSiteSocialClient,
  loadRecentMessages,
  loadSiteProfileRenameStatus,
  loadSiteSocialConfig,
  renameSiteProfile,
} from './site-social.mjs';
import { validateDisplayName } from './site-social-core.mjs';

const DISPLAY_NAME_KEY = 'hynoeSiteDisplayName';
const POLL_MS = 1600;

function ensureStyles() {
  if (document.querySelector('link[data-site-profile-rename-style]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/assets/site-profile-rename.css?v=20261007a';
  link.dataset.siteProfileRenameStyle = 'true';
  document.head.append(link);
}

function make(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function formatDate(value) {
  const parsed = Date.parse(String(value ?? ''));
  if (!Number.isFinite(parsed)) return 'later';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed);
}

function statusCopy(status) {
  if (status?.free_correction) return '1 free name correction available. After this, changes are limited to once every 30 days.';
  if (status?.can_rename) return 'Name change available. After saving, your next change is in 30 days.';
  return `Name locked until ${formatDate(status?.next_allowed_at)}.`;
}

async function decorateFormerNames(client) {
  const list = document.querySelector('.site-social-messages');
  if (!list || list.hidden) return;
  let rows;
  try { rows = await loadRecentMessages(client, 75); } catch { return; }
  const articles = [...list.querySelectorAll('.site-social-message')];
  const visibleRows = rows.slice(-articles.length);
  for (let index = 0; index < articles.length; index += 1) {
    const row = visibleRows[index];
    const name = articles[index].querySelector('.site-social-message-head strong');
    if (!name) continue;
    name.querySelector('.site-social-former-name')?.remove();
    if (!row?.former_display_name || row.former_display_name === row.display_name) continue;
    const former = make('span', 'site-social-former-name', ` formerly ${row.former_display_name}`);
    name.append(former);
  }
}

export async function installSiteProfileRenameTools() {
  if (typeof document === 'undefined') return;
  ensureStyles();

  let config;
  try { config = await loadSiteSocialConfig(); } catch { return; }
  if (!config.enabled) return;
  const client = createSiteSocialClient(config);

  let attempts = 0;
  while (!document.querySelector('.site-social-meta') && attempts < 30) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    attempts += 1;
  }
  const meta = document.querySelector('.site-social-meta');
  const pane = meta?.closest('.site-social-pane');
  if (!meta || !pane || pane.querySelector('[data-site-name-tools]')) return;

  const editButton = make('button', 'site-social-name-edit', 'EDIT NAME');
  editButton.type = 'button';
  editButton.hidden = true;
  meta.append(editButton);

  const card = make('form', 'site-social-name-card');
  card.dataset.siteNameTools = 'true';
  card.hidden = true;
  const title = make('strong', '', 'CHANGE DISPLAY NAME');
  const copy = make('p', 'site-social-name-copy');
  const input = document.createElement('input');
  input.type = 'text';
  input.maxLength = 24;
  input.autocomplete = 'nickname';
  input.setAttribute('aria-label', 'New display name');
  const actions = make('div', 'site-social-name-actions');
  const cancel = make('button', 'site-social-name-cancel', 'CANCEL');
  cancel.type = 'button';
  const save = make('button', 'site-social-primary', 'SAVE NAME');
  save.type = 'submit';
  const result = make('p', 'site-social-status');
  actions.append(cancel, save);
  card.append(title, copy, input, actions, result);
  meta.insertAdjacentElement('afterend', card);

  let renameStatus = null;
  let ready = false;

  const refreshStatus = async () => {
    try {
      renameStatus = await loadSiteProfileRenameStatus(client);
      ready = true;
      editButton.hidden = false;
      editButton.disabled = !renameStatus.can_rename;
      editButton.title = statusCopy(renameStatus);
      copy.textContent = statusCopy(renameStatus);
      input.value = renameStatus.display_name || '';
      try { localStorage.setItem(DISPLAY_NAME_KEY, renameStatus.display_name || ''); } catch {}
      await decorateFormerNames(client);
      return true;
    } catch {
      return false;
    }
  };

  editButton.addEventListener('click', () => {
    if (!ready || !renameStatus?.can_rename) return;
    card.hidden = false;
    input.value = renameStatus.display_name || '';
    result.textContent = renameStatus.free_correction
      ? 'This is your free correction. After saving, you must wait 30 days to change it again.'
      : 'After saving, you must wait 30 days to change it again.';
    input.focus();
    input.select();
  });

  cancel.addEventListener('click', () => {
    card.hidden = true;
    result.textContent = '';
  });

  card.addEventListener('submit', async (event) => {
    event.preventDefault();
    const checked = validateDisplayName(input.value);
    if (!checked.ok) { result.textContent = checked.error; return; }
    if (checked.value === renameStatus?.display_name) { card.hidden = true; return; }
    const warning = renameStatus?.free_correction
      ? `Change your name to “${checked.value}”? This uses your free correction. After this, you must wait 30 days.`
      : `Change your name to “${checked.value}”? You will have to wait 30 days before changing it again.`;
    if (!window.confirm(warning)) return;
    save.disabled = true;
    editButton.disabled = true;
    result.textContent = 'Changing name…';
    try {
      renameStatus = await renameSiteProfile(client, checked.value);
      try { localStorage.setItem(DISPLAY_NAME_KEY, renameStatus.display_name); } catch {}
      result.textContent = 'Name changed. You can change it again in 30 days.';
      setTimeout(() => location.reload(), 650);
    } catch (error) {
      result.textContent = error.message || 'Display name could not be changed.';
      save.disabled = false;
      editButton.disabled = !renameStatus?.can_rename;
    }
  });

  const list = document.querySelector('.site-social-messages');
  if (list && typeof MutationObserver !== 'undefined') {
    let timer = null;
    new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => decorateFormerNames(client), 80);
    }).observe(list, { childList: true });
  }

  for (;;) {
    const loaded = await refreshStatus();
    if (loaded) break;
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
}
