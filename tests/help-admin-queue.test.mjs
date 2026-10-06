import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fn=await readFile(new URL('../supabase/functions/moderate-site-chat/index.ts',import.meta.url),'utf8');
const admin=await readFile(new URL('../assets/site-social-admin.mjs',import.meta.url),'utf8');
const html=await readFile(new URL('../site-admin.html',import.meta.url),'utf8');

test('moderator dashboard returns a private Ask Hynoe quality queue',()=>{
  assert.match(fn,/site_help_feedback/);
  assert.match(fn,/help_feedback/);
  assert.match(fn,/unanswered|helpful/);
});

test('review_help_feedback updates only review fields and writes an audit record',()=>{
  assert.match(fn,/review_help_feedback/);
  assert.match(fn,/review_status/);
  assert.match(fn,/review_note/);
  assert.match(fn,/reviewed_by/);
  assert.match(fn,/site_moderation_audit/);
  assert.doesNotMatch(fn,/\.update\(\{[^}]*role:/s);
});

test('admin page renders Ask Hynoe queue with review actions',()=>{
  assert.match(html,/data-help-queue/);
  assert.match(admin,/help_feedback/);
  assert.match(admin,/review_help_feedback/);
  assert.match(admin,/Reviewed|Resolve|Ignore/i);
});
