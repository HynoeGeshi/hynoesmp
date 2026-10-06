import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrations = fs.readdirSync('supabase/migrations').filter((x) => x.includes('site_help_knowledge'));
const ask = fs.readFileSync('supabase/functions/ask-hynoe/index.ts', 'utf8');

test('Help knowledge store is private and server-only', () => {
  assert.ok(migrations.length > 0, 'missing site_help_knowledge migration');
  const sql = migrations.map((x) => fs.readFileSync(`supabase/migrations/${x}`, 'utf8')).join('\n');
  assert.match(sql, /create table[^;]*site_help_knowledge/is);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /revoke all[^;]*site_help_knowledge[^;]*anon[^;]*authenticated/is);
});

test('Ask Hynoe loads official index from the private knowledge store', () => {
  assert.doesNotMatch(ask, /import helpIndex from/);
  assert.match(ask, /from\(["']site_help_knowledge["']\)/);
  assert.match(ask, /knowledge\.index_json\.chunks/);
});
