import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeMessageBody,
  validateMessageBody,
  canPost,
  validateReplyTarget,
} from '../supabase/functions/_shared/site-chat-core.mjs';

test('server message normalization trims outer whitespace without interpreting HTML', () => {
  assert.equal(normalizeMessageBody('  <b>hello</b>  '), '<b>hello</b>');
});

test('server message validation caps body at 300 and rejects invisible/control-only input', () => {
  assert.equal(validateMessageBody('x'.repeat(300)).ok, true);
  assert.equal(validateMessageBody('x'.repeat(301)).ok, false);
  assert.equal(validateMessageBody('\u0000\u200B\n\t').ok, false);
});

test('posting is blocked for banned muted and cooldown states', () => {
  const now = 1_000_000;
  const limits = { minSpacingMs: 3000 };
  assert.equal(canPost({ is_banned: true, muted_until: null, last_post_at: null }, limits, now).ok, false);
  assert.equal(canPost({ is_banned: false, muted_until: new Date(now + 10_000).toISOString(), last_post_at: null }, limits, now).ok, false);
  assert.equal(canPost({ is_banned: false, muted_until: null, last_post_at: new Date(now - 2999).toISOString() }, limits, now).ok, false);
  assert.equal(canPost({ is_banned: false, muted_until: null, last_post_at: new Date(now - 3000).toISOString() }, limits, now).ok, true);
});

test('reply target must exist and not be deleted', () => {
  assert.equal(validateReplyTarget(null).ok, true);
  assert.equal(validateReplyTarget({ id: 'm1', deleted_at: null }).ok, true);
  assert.equal(validateReplyTarget({ id: 'm1', deleted_at: '2026-10-06T00:00:00Z' }).ok, false);
});
