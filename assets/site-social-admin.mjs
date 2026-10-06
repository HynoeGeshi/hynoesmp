import { createSiteSocialClient, loadSiteSocialConfig } from './site-social.mjs';

export async function adminSignIn(client, email, password) {
  const { data, error } = await client.auth.signInWithPassword({ email: String(email ?? '').trim(), password: String(password ?? '') });
  if (error || !data?.session) throw new Error('Admin sign-in failed.');
  return data.session;
}

export async function adminSignOut(client) {
  const { error } = await client.auth.signOut();
  if (error) throw new Error('Could not sign out.');
}

export async function loadAdminDashboard(client) {
  const { data, error } = await client.functions.invoke('moderate-site-chat', { body: { action: 'dashboard' } });
  if (error || !data) throw new Error('Admin dashboard could not be loaded.');
  return data;
}

export async function runModerationAction(client, action) {
  const { data, error } = await client.functions.invoke('moderate-site-chat', { body: action });
  if (error || !data) throw new Error('Moderation action failed.');
  return data;
}

export async function reviewHelpFeedback(client, { feedbackId, reviewStatus, reviewNote = null }) {
  return runModerationAction(client, {
    action: 'review_help_feedback',
    feedback_id: feedbackId,
    review_status: reviewStatus,
    review_note: reviewNote,
  });
}

function text(el, value) { if (el) el.textContent = String(value ?? ''); }

function make(tag, textValue = '', className = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (textValue) node.textContent = textValue;
  return node;
}

function renderHelpQueue(container, dashboard, client, rerender) {
  if (!container) return;
  container.replaceChildren();
  const queue = Array.isArray(dashboard?.help_feedback) ? dashboard.help_feedback : [];
  if (!queue.length) {
    container.append(make('p', 'No Ask Hynoe answers need review right now.', 'help-review-empty'));
    return;
  }
  for (const item of queue) {
    const card = make('article', '', 'help-review');
    const state = item.unanswered ? 'UNANSWERED' : item.helpful === false ? 'NOT HELPFUL' : String(item.review_status || 'NEW').toUpperCase();
    card.append(make('strong', `${state} · ${item.confidence || 'unknown'} confidence`));
    card.append(make('p', item.question || 'Question unavailable'));
    if (item.answer_summary) card.append(make('p', `Answer: ${item.answer_summary}`));
    card.append(make('small', `Mode: ${item.mode || 'unknown'} · Page: ${item.page_path || '/'} · ${item.created_at ? new Date(item.created_at).toLocaleString() : ''}`));
    const actions = make('div', '', 'help-review-actions');
    for (const [label, reviewStatus] of [['Reviewed','reviewed'],['Resolve','resolved'],['Ignore','ignored']]) {
      const button = make('button', label);
      button.type = 'button';
      button.addEventListener('click', async () => {
        button.disabled = true;
        try {
          await reviewHelpFeedback(client, { feedbackId:item.id, reviewStatus, reviewNote:null });
          await rerender();
        } catch (error) {
          button.disabled = false;
          throw error;
        }
      });
      actions.append(button);
    }
    card.append(actions);
    container.append(card);
  }
}

export async function initSiteAdminPage() {
  if (typeof document === 'undefined') return;
  const status = document.querySelector('[data-admin-status]');
  try {
    const config = await loadSiteSocialConfig();
    if (!config.enabled) { text(status, 'Community backend is not connected yet.'); return; }
    const client = createSiteSocialClient(config);
    const login = document.querySelector('[data-admin-login]');
    const app = document.querySelector('[data-admin-app]');
    const output = document.querySelector('[data-admin-output]');
    const helpQueue = document.querySelector('[data-help-queue]');

    const render = async () => {
      const dashboard = await loadAdminDashboard(client);
      if (login) login.hidden = true;
      if (app) app.hidden = false;
      if (output) output.textContent = JSON.stringify(dashboard, null, 2);
      renderHelpQueue(helpQueue, dashboard, client, render);
      text(status, `Moderator controls connected. ${dashboard.help_feedback?.length || 0} Ask Hynoe item(s) need review.`);
    };

    const { data } = await client.auth.getSession();
    if (data?.session) await render().catch(() => text(status, 'This account is not authorized for moderation.'));

    login?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = new FormData(login);
      try {
        await adminSignIn(client, form.get('email'), form.get('password'));
        await render();
      } catch (error) { text(status, error.message); }
    });
  } catch (error) { text(status, error.message || 'Admin controls are unavailable.'); }
}

if (typeof document !== 'undefined') initSiteAdminPage();
