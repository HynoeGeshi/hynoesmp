import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sendHelpFeedback } from '../assets/site-social.mjs';
import { validateModerationAction, normalizeHelpReviewInput } from '../supabase/functions/_shared/site-moderation-core.mjs';

test('visitor feedback calls Ask Hynoe privately with only request id + helpful boolean',async()=>{
  const calls=[];
  const client={functions:{async invoke(name,options){calls.push([name,options]);return {data:{ok:true},error:null};}}};
  await sendHelpFeedback(client,{requestId:'123e4567-e89b-42d3-a456-426614174000',helpful:false});
  assert.deepEqual(calls,[['ask-hynoe',{body:{action:'feedback',request_id:'123e4567-e89b-42d3-a456-426614174000',helpful:false}}]]);
});

test('help review action is allowlisted and validates only safe review fields',()=>{
  assert.equal(validateModerationAction('review_help_feedback').ok,true);
  assert.equal(normalizeHelpReviewInput({feedback_id:'123e4567-e89b-42d3-a456-426614174000',review_status:'resolved',review_note:'Updated the joining guide.'}).ok,true);
  assert.equal(normalizeHelpReviewInput({feedback_id:'bad',review_status:'resolved'}).ok,false);
  assert.equal(normalizeHelpReviewInput({feedback_id:'123e4567-e89b-42d3-a456-426614174000',review_status:'admin'}).ok,false);
  assert.equal(normalizeHelpReviewInput({feedback_id:'123e4567-e89b-42d3-a456-426614174000',review_status:'reviewed',review_note:'x'.repeat(1001)}).ok,false);
});

test('Ask Hynoe Edge Function handles feedback as an ownership-scoped server update',async()=>{
  const source=await readFile(new URL('../supabase/functions/ask-hynoe/index.ts',import.meta.url),'utf8');
  assert.match(source,/action\s*===\s*["']feedback["']/);
  assert.match(source,/site_help_feedback/);
  assert.match(source,/\.eq\(["']request_id["']/);
  assert.match(source,/\.eq\(["']user_id["']\s*,\s*userId\)/);
  assert.doesNotMatch(source,/payload\.(user_id|userId)/);
});

test('moderation dashboard includes private Ask Hynoe quality queue and protected review action',async()=>{
  const source=await readFile(new URL('../supabase/functions/moderate-site-chat/index.ts',import.meta.url),'utf8');
  assert.match(source,/site_help_feedback/);
  assert.match(source,/help_feedback/);
  assert.match(source,/review_help_feedback/);
  assert.match(source,/reviewed_by/);
  assert.match(source,/reviewed_at/);
});

test('admin client exposes Ask Hynoe review helper and page has a quality queue surface',async()=>{
  const client=await readFile(new URL('../assets/site-social-admin.mjs',import.meta.url),'utf8');
  const html=await readFile(new URL('../site-admin.html',import.meta.url),'utf8');
  assert.match(client,/reviewHelpFeedback/);
  assert.match(client,/data-help-queue/);
  assert.match(html,/data-help-queue/);
  assert.match(html,/Ask Hynoe quality/i);
});

test('site panel offers useful/not useful controls without rendering HTML',async()=>{
  const panel=await readFile(new URL('../assets/site-social-panel.mjs',import.meta.url),'utf8');
  assert.match(panel,/sendHelpFeedback/);
  assert.match(panel,/HELPFUL|USEFUL|NOT HELPFUL|NOT USEFUL/i);
  assert.doesNotMatch(panel,/innerHTML\s*=/);
});
