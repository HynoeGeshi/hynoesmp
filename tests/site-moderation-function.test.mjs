import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync('supabase/functions/moderate-site-chat/index.ts','utf8');
const config=fs.readFileSync('supabase/config.toml','utf8');

test('moderation function verifies database role server-side and has no role mutation action',()=>{
  assert.match(source,/site_profiles/);
  assert.match(source,/isSiteModeratorRole\(moderator\?\.role\)/);
  assert.doesNotMatch(source,/set_role/);
  assert.doesNotMatch(source,/user_metadata/);
});

test('moderation function uses current user auth, admin client, and audit log',()=>{
  assert.match(source,/withSupabase\(\{ auth: ["']user["'] \}/);
  assert.match(source,/ctx\.supabaseAdmin/);
  assert.match(source,/site_moderation_audit/);
  assert.match(config,/\[functions\.moderate-site-chat\][\s\S]*verify_jwt = true/);
});
