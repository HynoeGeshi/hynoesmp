import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../supabase/functions/ask-hynoe/index.ts',import.meta.url),'utf8').catch(()=> '');

test('ask-hynoe uses current Supabase user auth and keeps JWT verification enabled',()=>{
  assert.match(source,/withSupabase\s*\(\s*\{\s*auth:\s*["']user["']/);
  assert.match(source,/ctx\.userClaims/);
  assert.doesNotMatch(source,/verify_jwt\s*=\s*false/i);
});

test('ask-hynoe loads bundled official knowledge and never reads Global Chat',()=>{
  assert.match(source,/hynoe-help-index\.mjs/);
  assert.doesNotMatch(source,/site_chat_messages|site_chat_public_messages|Global Chat messages/i);
});

test('ask-hynoe enforces rate limiting, retrieval fallback, and private feedback logging',()=>{
  assert.match(source,/site_help_feedback/);
  assert.match(source,/created_at/);
  assert.match(source,/429/);
  assert.match(source,/rankHelpChunks/);
  assert.match(source,/buildFallbackAnswer/);
  assert.match(source,/answerWithProvider/);
});

test('ask-hynoe has explicit allowed origin and no browser-supplied user id',()=>{
  assert.match(source,/isAllowedSiteOrigin/);
  assert.doesNotMatch(source,/payload\.(user_id|userId)/);
});
