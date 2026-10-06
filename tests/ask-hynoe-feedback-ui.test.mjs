import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const panel=fs.readFileSync('assets/site-social-panel.mjs','utf8');
const social=fs.readFileSync('assets/site-social.mjs','utf8');
const endpoint=fs.readFileSync('supabase/functions/ask-hynoe/index.ts','utf8');
const css=fs.readFileSync('assets/site-social.css','utf8');

test('Ask Hynoe transcript stays memory-only and exposes clear conversation',()=>{
  assert.match(panel,/askHistory:\s*\[\]/);
  assert.match(panel,/CLEAR (?:CHAT|CONVERSATION)/i);
  assert.doesNotMatch(panel,/hynoeAskHistory|localStorage.*ask|saveAskHistory|loadAskHistory/i);
});

test('Ask Hynoe feedback uses the private function and never a direct browser table update',()=>{
  assert.match(panel,/sendHelpFeedback/);
  assert.match(panel,/👍 Helpful/);
  assert.match(panel,/👎 Not helpful/);
  assert.match(social,/functions\.invoke\(['"]ask-hynoe['"],\s*\{\s*body:\s*\{\s*action:\s*['"]feedback['"]/s);
  assert.doesNotMatch(social,/from\(['"]site_help_feedback['"]\).*update/s);
});

test('server scopes feedback mutation to both request id and authenticated user id',()=>{
  assert.match(endpoint,/payload\.action\s*===\s*["']feedback["']/);
  assert.match(endpoint,/\.eq\(["']request_id["'],\s*feedbackRequestId\)/);
  assert.match(endpoint,/\.eq\(["']user_id["'],\s*userId\)/);
  assert.match(endpoint,/typeof helpful !== ["']boolean["']/);
});

test('Ask feedback and clear-conversation controls have dedicated styling',()=>{
  assert.match(css,/site-social-ask-feedback/);
  assert.match(css,/site-social-ask-clear/);
});
