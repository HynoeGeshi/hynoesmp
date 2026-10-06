import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const dir=new URL('../supabase/migrations/',import.meta.url);
async function source(){
  const files=(await readdir(dir)).filter(n=>n.endsWith('_site_help_request_metrics.sql')).sort();
  assert.ok(files.length,'site_help_request_metrics migration missing');
  return readFile(new URL(files.at(-1),dir),'utf8');
}

test('help request metrics are server-only and protected by RLS', async()=>{
  const sql=await source();
  assert.match(sql,/create\s+table\s+public\.site_help_request_metrics/i);
  assert.match(sql,/alter\s+table\s+public\.site_help_request_metrics\s+enable\s+row\s+level\s+security/i);
  assert.match(sql,/revoke\s+all\s+on\s+public\.site_help_request_metrics\s+from\s+public\s*,\s*anon\s*,\s*authenticated/i);
  assert.doesNotMatch(sql,/grant\s+(?:select|insert|update|delete)[^;]*site_help_request_metrics[^;]*authenticated/i);
});

test('atomic request-slot claim is not callable by browser roles', async()=>{
  const sql=await source();
  assert.match(sql,/create\s+or\s+replace\s+function\s+public\.claim_site_help_request_slot/i);
  assert.match(sql,/security\s+invoker/i);
  assert.match(sql,/revoke\s+all\s+on\s+function\s+public\.claim_site_help_request_slot[^;]*from\s+public\s*,\s*anon\s*,\s*authenticated/i);
  assert.match(sql,/grant\s+execute\s+on\s+function\s+public\.claim_site_help_request_slot[^;]*to\s+service_role/i);
});

test('request metrics use one primary key plus an idempotency unique constraint', async()=>{
  const sql=await source();
  const primaryKeys=(sql.match(/primary\s+key/gi) || []).length;
  assert.equal(primaryKeys,1,'site_help_request_metrics must declare only one primary key');
  assert.match(sql,/request_id\s+uuid\s+not\s+null\s+unique/i,'request_id idempotency constraint missing');
});
