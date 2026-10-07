import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureSiteSession,
  ensureProfile,
  loadSiteSocialConfig,
  restoreSiteSession,
  clearSiteAuthStorage,
} from '../assets/site-social.mjs';

test('ensureSiteSession reuses an existing Supabase session', async () => {
  let anonymousCalls = 0;
  const session = { user: { id: 'user-1', is_anonymous: true } };
  const client = {
    auth: {
      async getSession() { return { data: { session }, error: null }; },
      async signInAnonymously() { anonymousCalls++; return { data: {}, error: null }; },
    },
  };
  const result = await ensureSiteSession(client, 'turnstile-token');
  assert.equal(result, session);
  assert.equal(anonymousCalls, 0);
});

test('ensureSiteSession passes Turnstile token to anonymous auth bootstrap', async () => {
  let received;
  const session = { user: { id: 'user-2', is_anonymous: true } };
  const client = {
    auth: {
      async getSession() { return { data: { session: null }, error: null }; },
      async signInAnonymously(options) {
        received = options;
        return { data: { session }, error: null };
      },
    },
  };
  const result = await ensureSiteSession(client, 'captcha-123');
  assert.equal(result, session);
  assert.deepEqual(received, { options: { captchaToken: 'captcha-123' } });
});

test('ensureSiteSession bootstraps anonymously without Turnstile when CAPTCHA is not configured', async () => {
  let received = 'not-called';
  const session = { user: { id: 'user-3', is_anonymous: true } };
  const client = {
    auth: {
      async getSession() { return { data: { session: null }, error: null }; },
      async signInAnonymously(options) {
        received = options;
        return { data: { session }, error: null };
      },
    },
  };
  const result = await ensureSiteSession(client, '');
  assert.equal(result, session);
  assert.equal(received, undefined);
});

test('restoreSiteSession times out instead of leaving identity stuck loading forever', async () => {
  const client = { auth: { getSession() { return new Promise(() => {}); } } };
  const started = Date.now();
  const result = await restoreSiteSession(client, { timeoutMs: 20 });
  assert.deepEqual(result, { session: null, timedOut: true });
  assert.ok(Date.now() - started < 250);
});

test('clearSiteAuthStorage removes only this Supabase project auth token', () => {
  const removed = [];
  const storage = { removeItem(key) { removed.push(key); } };
  const key = clearSiteAuthStorage({ supabaseUrl: 'https://abc123.supabase.co' }, storage);
  assert.equal(key, 'sb-abc123-auth-token');
  assert.deepEqual(removed, ['sb-abc123-auth-token']);
});

function profileClient(existing = null) {
  const actions = [];
  const query = {
    select() { return query; },
    eq() { return query; },
    async maybeSingle() { return { data: existing, error: null }; },
    async insert(payload) { actions.push(['insert', payload]); return { data: payload[0], error: null }; },
    update(payload) { actions.push(['update', payload]); return query; },
  };
  return { client: { from(name) { assert.equal(name, 'site_profiles'); return query; } }, actions };
}

test('ensureProfile creates only safe guest profile fields for current user', async () => {
  const { client, actions } = profileClient(null);
  const result = await ensureProfile(client, { id: 'user-3' }, '  Player  Three ');
  assert.equal(result.display_name, 'Player Three');
  assert.deepEqual(actions[0], ['insert', [{
    user_id: 'user-3',
    display_name: 'Player Three',
    normalized_name: 'player three',
    avatar_seed: 'user-3',
  }]]);
});

test('ensureProfile preserves an existing display name until the protected rename endpoint is used', async () => {
  const existing = { user_id: 'user-4', display_name: 'Old Name', normalized_name: 'old name', avatar_seed: 'seed' };
  const { client, actions } = profileClient(existing);
  const result = await ensureProfile(client, { id: 'user-4' }, 'New Name');
  assert.equal(result.display_name, 'Old Name');
  assert.deepEqual(actions, []);
});

test('loadSiteSocialConfig accepts disabled config, allows optional Turnstile, and rejects unsafe enabled endpoints', async () => {
  const disabled = await loadSiteSocialConfig(async () => ({ ok: true, async json() { return { enabled: false }; } }));
  assert.deepEqual(disabled, { enabled: false });

  const enabled = await loadSiteSocialConfig(async () => ({
    ok: true,
    async json() {
      return {
        enabled: true,
        supabaseUrl: 'https://example.supabase.co',
        supabasePublishableKey: 'sb_publishable_test',
        turnstileSiteKey: '',
      };
    },
  }));
  assert.equal(enabled.enabled, true);
  assert.equal(enabled.turnstileSiteKey, '');

  await assert.rejects(
    () => loadSiteSocialConfig(async () => ({ ok: true, async json() { return { enabled: true, supabaseUrl: 'http://bad.example', supabasePublishableKey: 'sb_publishable_x', turnstileSiteKey: 'site' }; } })),
    /https/i,
  );
});
