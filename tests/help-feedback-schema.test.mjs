import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const migrationDir = new URL('../supabase/migrations/', import.meta.url);

async function sql() {
  const files = (await readdir(migrationDir)).filter((name) => name.endsWith('_site_help_feedback.sql')).sort();
  assert.ok(files.length, 'site_help_feedback migration missing');
  return readFile(new URL(files.at(-1), migrationDir), 'utf8');
}

function has(source, pattern, message) {
  assert.match(source, pattern, message);
}

test('Ask Hynoe feedback table is private by default with RLS', async () => {
  const source = await sql();
  has(source, /create\s+table\s+public\.site_help_feedback/i, 'feedback table missing');
  has(source, /enable\s+row\s+level\s+security/i, 'RLS missing');
  has(source, /revoke\s+all\s+on\s+public\.site_help_feedback\s+from\s+anon\s*,\s*authenticated/i, 'default browser revoke missing');
  has(source, /grant\s+select\s*\([^)]*(?:question|answer_summary)[^)]*\)\s+on\s+public\.site_help_feedback\s+to\s+authenticated/i, 'bounded authenticated read grant missing');
});

test('visitors can read only their own feedback while admins can read quality queue', async () => {
  const source = await sql();
  has(source, /create\s+policy\s+"site help feedback read own"[\s\S]*?using\s*\(\s*\(select\s+auth\.uid\(\)\)\s*=\s*user_id\s*\)/i, 'own-row read policy missing');
  has(source, /create\s+policy\s+"site help feedback staff read"[\s\S]*?role\s+in\s*\(\s*'moderator'\s*,\s*'admin'\s*\)/i, 'staff quality queue policy missing');
  assert.doesNotMatch(source, /create\s+policy[^;]*using\s*\(\s*true\s*\)[^;]*site_help_feedback/i, 'feedback must not be globally readable');
});

test('browser cannot directly insert or mutate admin review fields', async () => {
  const source = await sql();
  assert.doesNotMatch(source, /grant\s+insert[^;]*site_help_feedback\s+to\s+(?:anon|authenticated)/i, 'browser insert grant must not exist');
  assert.doesNotMatch(source, /grant\s+update[^;]*site_help_feedback\s+to\s+(?:anon|authenticated)/i, 'browser update grant must not exist');
  has(source, /review_status\s+text\s+not\s+null\s+default\s+'new'/i, 'admin review status missing');
  has(source, /reviewed_by\s+uuid/i, 'reviewed_by field missing');
});

test('feedback fields are bounded and request IDs are unique', async () => {
  const source = await sql();
  has(source, /question\s+text\s+not\s+null[\s\S]*?length\(question\)\s+between\s+1\s+and\s+600/i, 'question length bound missing');
  has(source, /answer_summary\s+text[\s\S]*?length\(answer_summary\)\s*<=\s*1200/i, 'answer summary bound missing');
  has(source, /request_id\s+uuid\s+not\s+null\s+unique/i, 'unique request ID missing');
  has(source, /source_ids\s+text\[\]/i, 'source IDs missing');
});
