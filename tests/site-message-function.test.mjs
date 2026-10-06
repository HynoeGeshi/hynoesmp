import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('supabase/functions/send-site-message/index.ts', 'utf8');
const config = fs.readFileSync('supabase/config.toml', 'utf8');
const migration = fs.readFileSync(fs.readdirSync('supabase/migrations').filter(n => n.endsWith('_site_global_chat.sql')).sort().map(n => `supabase/migrations/${n}`).at(-1), 'utf8');

test('send-site-message uses current Supabase user auth and server admin client', () => {
  assert.match(source, /withSupabase\(\{ auth: ["']user["'] \}/);
  assert.match(source, /ctx\.supabaseAdmin/);
  assert.match(source, /ctx\.userClaims/);
  assert.match(config, /\[functions\.send-site-message\][\s\S]*verify_jwt = true/);
});

test('send-site-message enforces explicit origin and has no caller-supplied author id', () => {
  assert.match(source, /isAllowedSiteOrigin\(origin\)/);
  assert.doesNotMatch(source, /payload\.author_id/);
  assert.match(source, /author_id", userId/);
});

test('send-site-message has retry idempotency and atomic cooldown claim', () => {
  assert.match(source, /request_id/);
  assert.match(source, /claim_site_chat_post_slot/);
  assert.match(migration, /create or replace function public\.claim_site_chat_post_slot/);
  assert.match(migration, /revoke all on function public\.claim_site_chat_post_slot\([^;]+from public, anon, authenticated/i);
});
