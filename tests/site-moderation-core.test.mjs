import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSiteModeratorRole,
  validateModerationAction,
  parseModerationUntil,
  normalizeAnnouncementInput,
} from '../supabase/functions/_shared/site-moderation-core.mjs';

test('only moderator and admin roles authorize moderation', () => {
  assert.equal(isSiteModeratorRole('moderator'), true);
  assert.equal(isSiteModeratorRole('admin'), true);
  assert.equal(isSiteModeratorRole('member'), false);
  assert.equal(isSiteModeratorRole('guest'), false);
});

test('moderation action allowlist excludes role assignment and arbitrary table actions', () => {
  for (const action of ['dashboard','tombstone_message','mute_user','ban_user','unban_user','resolve_report','set_announcement','deactivate_announcement','set_chat_pause']) {
    assert.equal(validateModerationAction(action).ok, true, action);
  }
  assert.equal(validateModerationAction('set_role').ok, false);
  assert.equal(validateModerationAction('sql').ok, false);
});

test('mute/ban timestamps must be future bounded ISO timestamps', () => {
  const now = Date.parse('2026-10-06T12:00:00Z');
  assert.equal(parseModerationUntil('2026-10-07T12:00:00Z', now, 30).ok, true);
  assert.equal(parseModerationUntil('2026-10-05T12:00:00Z', now, 30).ok, false);
  assert.equal(parseModerationUntil('2027-12-01T12:00:00Z', now, 30).ok, false);
});

test('announcement normalization caps text and accepts only same-site relative links', () => {
  assert.deepEqual(normalizeAnnouncementInput({ body:'  Server event tonight  ', link_url:'/updates.html' }), {
    ok:true, value:{ body:'Server event tonight', link_url:'/updates.html', expires_at:null },
  });
  assert.equal(normalizeAnnouncementInput({ body:'x'.repeat(501) }).ok, false);
  assert.equal(normalizeAnnouncementInput({ body:'hello', link_url:'https://evil.example' }).ok, false);
});
