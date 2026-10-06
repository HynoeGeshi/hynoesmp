import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeDisplayName,
  validateDisplayName,
  validateClientMessage,
  computeUnread,
} from '../assets/site-social-core.mjs';

test('display names normalize spacing and reject reserved Hynoe staff names', () => {
  assert.equal(normalizeDisplayName('  Terrell   Fan  '), 'Terrell Fan');
  assert.equal(validateDisplayName('Hynoe').ok, false);
  assert.equal(validateDisplayName('ADMIN').ok, false);
  assert.equal(validateDisplayName('Player_17').ok, true);
});

test('client message validation enforces 300 characters and rejects blank control-only text', () => {
  assert.equal(validateClientMessage('x'.repeat(300)).ok, true);
  assert.equal(validateClientMessage('x'.repeat(301)).ok, false);
  assert.equal(validateClientMessage(' \n\t\u200B ').ok, false);
});

test('HTML-looking message text remains data instead of being normalized away', () => {
  const value = '<script>alert(1)</script>';
  const result = validateClientMessage(value);
  assert.equal(result.ok, true);
  assert.equal(result.value, value);
});

test('unread increments only when global chat is not actively visible', () => {
  assert.equal(computeUnread({ count: 2, panelOpen: false, activeTab: 'global' }, { type: 'message' }), 3);
  assert.equal(computeUnread({ count: 2, panelOpen: true, activeTab: 'ask' }, { type: 'message' }), 3);
  assert.equal(computeUnread({ count: 2, panelOpen: true, activeTab: 'global' }, { type: 'message' }), 0);
});
