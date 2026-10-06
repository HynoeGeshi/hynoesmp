import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureSiteSession,
  ensureProfile,
  loadSiteSocialConfig,
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

test('ensureSiteSession fails closed when bootstrap has no Turnstile token', async () => {
  const client = { auth: { async getSession() { return { data: { session: null }, error: null }; } } };
  await assert.rejects(() => ensureSiteSession(client, ''), /verification/i);
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

test('ensureProfile updates only safe display fields when profile already exists', async () => {
  const existing = { user_id: 'user-4', display_name: 'Old Name', normalized_name: 'old name', avatar_seed: 'seed' };
  const { client, actions } = profileClient(existing);
  await ensureProfile(client, { id: 'user-4' }, 'New Name');
  assert.deepEqual(actions[0], ['update', { display_name: 'New Name', normalized_name: 'new name', avatar_seed: 'seed' }]);
});

test('loadSiteSocialConfig accepts disabled config but rejects unsafe enabled endpoints', async () => {
  const disabled = await loadSiteSocialConfig(async () => ({ ok: true, async json() { return { enabled: false }; } }));
  assert.deepEqual(disabled, { enabled: false });

  await assert.rejects(
    () => loadSiteSocialConfig(async () => ({ ok: true, async json() { return { enabled: true, supabaseUrl: 'http://bad.example', supabasePublishableKey: 'sb_publishable_x', turnstileSiteKey: 'site' }; } })),
    /https/i,
  );
});
