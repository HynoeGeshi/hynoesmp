import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../supabase/functions/ask-hynoe/index.ts',import.meta.url),'utf8');

test('ask-hynoe uses current Supabase user auth and keeps JWT verification enabled',()=>{
  assert.match(source,/withSupabase\s*\(\s*\{\s*auth:\s*["']user["']/);
  assert.match(source,/ctx\.userClaims/);
  assert.doesNotMatch(source,/verify_jwt\s*=\s*false/i);
});

test('ask-hynoe loads private official knowledge and delegates to the shared grounded engine',()=>{
  assert.match(source,/site_help_knowledge/);
  assert.match(source,/validateAskInput/);
  assert.match(source,/answerAskHynoe/);
  assert.doesNotMatch(source,/site_chat_messages|site_chat_public_messages|site_chat_reactions/i);
});

test('ask-hynoe uses atomic request metrics and private feedback logging',()=>{
  assert.match(source,/claim_site_help_request_slot/);
  assert.match(source,/site_help_request_metrics/);
  assert.match(source,/site_help_feedback/);
  assert.match(source,/429/);
});

test('ask-hynoe has explicit allowed origin and no browser-supplied user id',()=>{
  assert.match(source,/isAllowedSiteOrigin/);
  assert.doesNotMatch(source,/payload\.(user_id|userId)/);
  assert.doesNotMatch(source,/service_role|sb_secret_/i);
});

test('ask-hynoe allows Supabase browser client headers through CORS',()=>{
  assert.match(source,/Access-Control-Allow-Headers[^\n]*x-client-info/i);
  assert.match(source,/Access-Control-Allow-Methods[^\n]*POST[^\n]*OPTIONS/i);
});
