import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeDisplayName,
  validateDisplayName,
  validateClientMessage,
  computeUnread,
  censorChatProfanity,
  containsBlockedChatContent,
  sanitizeSiteChatMessages,
  messageDisplayBody,
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

test('website chat read filter censors profanity and hides blocked history', () => {
  const messages = sanitizeSiteChatMessages([
    { id: '1', display_name: 'Player', body: 'That was fucking wild.' },
    { id: '2', display_name: 'Player', body: 'I will kill you.' },
    { id: '3', display_name: 'Player', body: 'you n1gg3r' },
    { id: '4', display_name: 'Shithead', body: 'class assignment; sex education matters' },
  ]);
  assert.deepEqual(messages.map(({ id }) => id), ['1', '4']);
  assert.equal(messages[0].body, 'That was ******* wild.');
  assert.equal(messages[1].display_name, '********');
  assert.equal(messages[1].body, 'class assignment; sex education matters');
  assert.equal(containsBlockedChatContent('go k.y.s.'), true);
  assert.equal(censorChatProfanity('f.u.c.k.'), '*.*.*.*.');
  assert.equal(messageDisplayBody({ body: 'send me nudes' }), 'Message hidden by the language filter.');
});
