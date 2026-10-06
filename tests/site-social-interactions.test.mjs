import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SITE_REACTIONS,
  validateReaction,
  validateReport,
  messageDisplayBody,
  isAnnouncementActive,
} from '../assets/site-social-core.mjs';
import {
  sendSiteMessage,
  setMessageReaction,
  reportSiteMessage,
  loadMessageReactions,
  loadActiveAnnouncement,
} from '../assets/site-social.mjs';

test('reaction set is small and validation rejects arbitrary values', () => {
  assert.deepEqual(SITE_REACTIONS, ['like','love','laugh','fire','wow']);
  assert.equal(validateReaction('fire').ok, true);
  assert.equal(validateReaction('<script>').ok, false);
});

test('report validation caps details and restricts reasons', () => {
  assert.equal(validateReport('spam', 'x'.repeat(500)).ok, true);
  assert.equal(validateReport('spam', 'x'.repeat(501)).ok, false);
  assert.equal(validateReport('made-up', '').ok, false);
});

test('deleted messages always render a tombstone instead of original content', () => {
  assert.equal(messageDisplayBody({ is_deleted: true, body: 'secret old text' }), 'Message removed by moderation.');
  assert.equal(messageDisplayBody({ is_deleted: false, body: '<b>plain text</b>' }), '<b>plain text</b>');
});

test('announcement activity respects active flag and expiry', () => {
  const now = Date.parse('2026-10-06T12:00:00Z');
  assert.equal(isAnnouncementActive({ active: true, expires_at: null }, now), true);
  assert.equal(isAnnouncementActive({ active: true, expires_at: '2026-10-06T11:59:59Z' }, now), false);
  assert.equal(isAnnouncementActive({ active: false, expires_at: null }, now), false);
});

test('sendSiteMessage invokes only controlled Edge Function and carries reply id', async () => {
  const calls = [];
  const client = { functions: { async invoke(name, options) { calls.push([name, options]); return { data: { id: 'm1', created_at: 'now' }, error: null }; } } };
  const requestId = crypto.randomUUID();
  const result = await sendSiteMessage(client, { body: 'hello', replyTo: 'parent', requestId });
  assert.equal(result.id, 'm1');
  assert.deepEqual(calls, [['send-site-message', { body: { body: 'hello', reply_to: 'parent', request_id: requestId } }]]);
});

test('reaction write is scoped to authenticated user and message', async () => {
  const ops = [];
  const query = {
    async insert(rows) { ops.push(['insert', rows]); return { error: null }; },
    delete() { ops.push(['delete']); return query; },
    eq(column, value) { ops.push(['eq', column, value]); return query; },
    then(resolve) { resolve({ error: null }); },
  };
  const client = { from(name) { assert.equal(name, 'site_chat_reactions'); return query; } };
  await setMessageReaction(client, { messageId: 'm1', userId: 'u1', reaction: 'fire', active: true });
  await setMessageReaction(client, { messageId: 'm1', userId: 'u1', reaction: 'fire', active: false });
  assert.deepEqual(ops[0], ['insert', [{ message_id: 'm1', user_id: 'u1', reaction: 'fire' }]]);
  assert.ok(ops.some(op => op[0] === 'delete'));
  assert.ok(ops.some(op => op[0] === 'eq' && op[1] === 'user_id' && op[2] === 'u1'));
});

test('reports are insert-only and reactions/announcement loaders use safe public reads', async () => {
  const calls = [];
  const makeQuery = (name) => {
    const q = {
      select(cols) { calls.push([name,'select',cols]); return q; },
      in(col, values) { calls.push([name,'in',col,values]); return q; },
      eq(col, value) { calls.push([name,'eq',col,value]); return q; },
      order(col, opts) { calls.push([name,'order',col,opts]); return q; },
      limit(value) { calls.push([name,'limit',value]); return q; },
      async maybeSingle() { return { data: { id: 'a1', active: true }, error: null }; },
      async insert(rows) { calls.push([name,'insert',rows]); return { error: null }; },
      then(resolve) { resolve({ data: [{ message_id:'m1', user_id:'u1', reaction:'like' }], error: null }); },
    };
    return q;
  };
  const client = { from(name) { return makeQuery(name); } };
  await reportSiteMessage(client, { messageId:'m1', userId:'u1', reason:'spam', details:'repeat' });
  const reactions = await loadMessageReactions(client, ['m1']);
  const announcement = await loadActiveAnnouncement(client);
  assert.equal(reactions.length, 1);
  assert.equal(announcement.id, 'a1');
  assert.ok(calls.some(c => c[0] === 'site_chat_reports' && c[1] === 'insert'));
  assert.ok(calls.some(c => c[0] === 'site_announcements' && c[1] === 'eq' && c[2] === 'active' && c[3] === true));
});
