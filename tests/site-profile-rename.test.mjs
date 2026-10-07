import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import * as socialCore from '../assets/site-social-core.mjs';

const socialClient = fs.readFileSync(new URL('../assets/site-social.mjs', import.meta.url), 'utf8');
const socialPanel = fs.readFileSync(new URL('../assets/site-social-panel.mjs', import.meta.url), 'utf8');
const moderation = fs.readFileSync(new URL('../supabase/functions/moderate-site-chat/index.ts', import.meta.url), 'utf8');

test('rename eligibility gives one free correction then enforces a 30-day cooldown', () => {
  assert.equal(typeof socialCore.getDisplayNameRenameEligibility, 'function');
  if (typeof socialCore.getDisplayNameRenameEligibility !== 'function') return;

  const first = socialCore.getDisplayNameRenameEligibility({ renameCount: 0, lastRenamedAt: null }, Date.parse('2026-10-07T00:00:00Z'));
  assert.deepEqual(first, { allowed: true, freeCorrection: true, nextAllowedAt: null });

  const blocked = socialCore.getDisplayNameRenameEligibility({ renameCount: 1, lastRenamedAt: '2026-10-01T00:00:00Z' }, Date.parse('2026-10-07T00:00:00Z'));
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.freeCorrection, false);
  assert.equal(blocked.nextAllowedAt, '2026-10-31T00:00:00.000Z');

  const ready = socialCore.getDisplayNameRenameEligibility({ renameCount: 1, lastRenamedAt: '2026-09-01T00:00:00Z' }, Date.parse('2026-10-07T00:00:00Z'));
  assert.equal(ready.allowed, true);
});

test('browser uses a server-authoritative rename endpoint instead of direct profile updates', () => {
  assert.match(socialClient, /renameSiteProfile/);
  assert.match(socialClient, /rename-site-profile/);
  assert.doesNotMatch(socialClient, /\.update\(\{ display_name: checked\.value, normalized_name: normalized/);
});

test('community panel exposes edit-name controls and a formerly-name marker', () => {
  assert.match(socialPanel, /EDIT NAME/);
  assert.match(socialPanel, /formerly/i);
  assert.match(socialPanel, /30 days/i);
});

test('moderation supports a display-name override and private rename history', () => {
  assert.match(moderation, /rename_user/);
  assert.match(moderation, /site_profile_name_history/);
});
