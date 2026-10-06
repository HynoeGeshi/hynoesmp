import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const migrationDir = path.resolve('supabase/migrations');
const files = fs.existsSync(migrationDir)
  ? fs.readdirSync(migrationDir).filter((name) => name.endsWith('_site_global_chat.sql')).sort()
  : [];
const sql = files.length ? fs.readFileSync(path.join(migrationDir, files.at(-1)), 'utf8') : '';

function has(pattern, message) {
  assert.match(sql, pattern, message);
}

test('global chat migration creates required tables with RLS', () => {
  for (const table of ['site_profiles','site_chat_messages','site_chat_reactions','site_chat_reports','site_announcements','site_moderation_audit','site_chat_settings']) {
    has(new RegExp(`create table(?: if not exists)? public\\.${table}`, 'i'), `missing ${table}`);
    has(new RegExp(`alter table public\\.${table} enable row level security`, 'i'), `RLS missing on ${table}`);
  }
});

test('message table is not directly insertable by browser roles', () => {
  assert.doesNotMatch(sql, /grant\s+insert[^;]*site_chat_messages[^;]*to\s+(?:anon|authenticated)/i);
  has(/grant\s+select\s+on\s+public\.site_chat_public_messages\s+to\s+authenticated/i, 'safe history view must be explicitly readable');
});

test('base-table read grants expose only columns required by safe public surfaces', () => {
  assert.doesNotMatch(sql, /grant\s+select\s+on\s+public\.site_profiles\s+to\s+authenticated/i);
  has(/grant\s+select\s*\(\s*user_id\s*,\s*display_name\s*,\s*normalized_name\s*,\s*avatar_seed\s*,\s*role\s*\)\s+on\s+public\.site_profiles\s+to\s+authenticated/i, 'profile safe column grant missing');
  assert.doesNotMatch(sql, /grant\s+select\s+on\s+public\.site_chat_messages\s+to\s+authenticated/i);
  has(/grant\s+select\s*\([^)]*body[^)]*deleted_at[^)]*\)\s+on\s+public\.site_chat_messages\s+to\s+authenticated/i, 'message safe column grant missing');
  has(/create trigger site_chat_messages_scrub_deleted_trigger/i, 'deleted body scrub trigger missing');
});

test('profile updates expose only safe columns and not authorization fields', () => {
  has(/grant\s+update\s*\(\s*display_name\s*,\s*normalized_name\s*,\s*avatar_seed\s*\)\s+on\s+public\.site_profiles\s+to\s+authenticated/i, 'safe column update grant missing');
  assert.doesNotMatch(sql, /grant\s+update\s+on\s+public\.site_profiles\s+to\s+authenticated/i);
});

test('private realtime topic is constrained to site:global and broadcast/presence', () => {
  has(/realtime\.topic\(\)\)\s*=\s*'site:global'/i, 'topic restriction missing');
  has(/extension\s+in\s*\(\s*'broadcast'\s*,\s*'presence'\s*\)/i, 'extension restriction missing');
});

test('authorization never uses user metadata and admin audit is not granted to visitors', () => {
  assert.doesNotMatch(sql, /user_metadata/i);
  assert.doesNotMatch(sql, /grant\s+select[^;]*site_moderation_audit[^;]*to\s+authenticated/i);
});
