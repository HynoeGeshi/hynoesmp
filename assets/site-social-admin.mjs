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

function text(el, value) { if (el) el.textContent = String(value ?? ''); }

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

    const render = async () => {
      const dashboard = await loadAdminDashboard(client);
      if (login) login.hidden = true;
      if (app) app.hidden = false;
      if (output) output.textContent = JSON.stringify(dashboard, null, 2);
      text(status, 'Moderator controls connected.');
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
