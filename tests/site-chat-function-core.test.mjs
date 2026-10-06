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

import { prepareSiteMessage, isAllowedSiteOrigin, validateRequestId } from '../supabase/functions/_shared/site-chat-core.mjs';

test('site message request requires authenticated user identity', () => {
  const result = prepareSiteMessage({ userId: '', profile: null, settings: {}, body: 'hello', reply: null, requestId: crypto.randomUUID(), now: 1000 });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'unauthorized');
});

test('site message request rejects paused chat before creating a row', () => {
  const result = prepareSiteMessage({
    userId: 'u1', profile: { user_id: 'u1', is_banned: false, muted_until: null, last_post_at: null },
    settings: { posting_paused: true }, body: 'hello', reply: null, requestId: crypto.randomUUID(), now: 1000,
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'chat_paused');
});

test('site message request maps moderation cooldown and reply failures to safe codes', () => {
  const base = { userId: 'u1', settings: { posting_paused: false }, body: 'hello', requestId: crypto.randomUUID(), now: 10_000 };
  assert.equal(prepareSiteMessage({ ...base, profile: { user_id: 'u1', is_banned: true, muted_until: null, last_post_at: null }, reply: null }).code, 'posting_blocked');
  assert.equal(prepareSiteMessage({ ...base, profile: { user_id: 'u1', is_banned: false, muted_until: null, last_post_at: new Date(9_999).toISOString() }, reply: null }).code, 'rate_limited');
  assert.equal(prepareSiteMessage({ ...base, profile: { user_id: 'u1', is_banned: false, muted_until: null, last_post_at: null }, reply: { id: 'm1', deleted_at: '2026-10-06T00:00:00Z' } }).code, 'invalid_reply');
});

test('site message request builds authoritative insert payload from authenticated user', () => {
  const requestId = crypto.randomUUID();
  const result = prepareSiteMessage({
    userId: 'u1',
    profile: { user_id: 'u1', is_banned: false, muted_until: null, last_post_at: null },
    settings: { posting_paused: false },
    body: '  hello <b>site</b>  ',
    reply: { id: 'm9', deleted_at: null },
    requestId,
    now: 20_000,
  });
  assert.deepEqual(result, {
    ok: true,
    row: { author_id: 'u1', body: 'hello <b>site</b>', reply_to: 'm9', request_id: requestId },
  });
});

test('request IDs must be UUIDs and allowed origins are explicit', () => {
  assert.equal(validateRequestId(crypto.randomUUID()).ok, true);
  assert.equal(validateRequestId('not-a-uuid').ok, false);
  assert.equal(isAllowedSiteOrigin('https://hynoesmp.com'), true);
  assert.equal(isAllowedSiteOrigin('https://www.hynoesmp.com'), true);
  assert.equal(isAllowedSiteOrigin('https://evil.example'), false);
});
