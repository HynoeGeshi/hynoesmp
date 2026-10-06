import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadRecentMessages,
  connectGlobalChannel,
} from '../assets/site-social.mjs';
import {
  mergeMessageLists,
  presenceOnlineCount,
} from '../assets/site-social-core.mjs';

test('mergeMessageLists dedupes by id, keeps newest authoritative value, and sorts chronologically', () => {
  const current = [
    { id: 'a', body: 'old', created_at: '2026-10-06T10:00:00Z' },
    { id: 'b', body: 'b', created_at: '2026-10-06T10:01:00Z' },
  ];
  const next = [
    { id: 'a', body: 'updated', created_at: '2026-10-06T10:00:00Z' },
    { id: 'c', body: 'c', created_at: '2026-10-06T10:02:00Z' },
  ];
  assert.deepEqual(mergeMessageLists(current, next).map(m => [m.id, m.body]), [
    ['a', 'updated'], ['b', 'b'], ['c', 'c'],
  ]);
});

test('presenceOnlineCount counts unique authenticated presence keys', () => {
  assert.equal(presenceOnlineCount({ u1: [{ user_id: 'u1' }], u2: [{ user_id: 'u2' }, { user_id: 'u2' }] }), 2);
  assert.equal(presenceOnlineCount(null), 0);
});

test('loadRecentMessages queries safe history view newest-first then returns chronological history', async () => {
  const calls = [];
  const query = {
    select(value) { calls.push(['select', value]); return query; },
    order(column, options) { calls.push(['order', column, options]); return query; },
    async limit(value) {
      calls.push(['limit', value]);
      return { data: [
        { id: 'new', created_at: '2026-10-06T10:02:00Z' },
        { id: 'old', created_at: '2026-10-06T10:01:00Z' },
      ], error: null };
    },
  };
  const client = { from(name) { assert.equal(name, 'site_chat_public_messages'); return query; } };
  const result = await loadRecentMessages(client, 25);
  assert.deepEqual(result.map(m => m.id), ['old', 'new']);
  assert.deepEqual(calls, [
    ['select', '*'],
    ['order', 'created_at', { ascending: false }],
    ['limit', 25],
  ]);
});

test('connectGlobalChannel uses private site:global, tracks presence after subscribe, and refreshes history on reconnect', async () => {
  const handlers = [];
  const trackCalls = [];
  let subscribeCallback;
  let removeCalls = 0;
  let authCalls = 0;
  const channel = {
    on(type, filter, callback) { handlers.push([type, filter, callback]); return channel; },
    subscribe(callback) { subscribeCallback = callback; return channel; },
    async track(payload) { trackCalls.push(payload); },
    async untrack() {},
  };
  const client = {
    realtime: { async setAuth() { authCalls++; } },
    channel(topic, options) {
      assert.equal(topic, 'site:global');
      assert.deepEqual(options, { config: { private: true, presence: { key: 'u1' } } });
      return channel;
    },
    async removeChannel(value) { assert.equal(value, channel); removeCalls++; },
  };
  let refreshes = 0;
  const statuses = [];
  const connection = await connectGlobalChannel(client, {
    userId: 'u1', displayName: 'Player', page: '/join.html',
    onBroadcast() {}, onPresence() {},
    async refreshHistory() { refreshes++; },
    onStatus(status) { statuses.push(status); },
  });
  assert.equal(authCalls, 1);
  await subscribeCallback('SUBSCRIBED');
  await subscribeCallback('CLOSED');
  await subscribeCallback('SUBSCRIBED');
  assert.equal(refreshes, 2);
  assert.equal(trackCalls.length, 2);
  assert.equal(trackCalls[0].user_id, 'u1');
  assert.equal(trackCalls[0].display_name, 'Player');
  assert.equal(trackCalls[0].page, '/join.html');
  assert.ok(handlers.some(([type, filter]) => type === 'broadcast' && filter.event === '*'));
  assert.ok(handlers.some(([type, filter]) => type === 'presence' && filter.event === 'sync'));
  assert.deepEqual(statuses, ['SUBSCRIBED', 'CLOSED', 'SUBSCRIBED']);
  await connection.disconnect();
  assert.equal(removeCalls, 1);
});
