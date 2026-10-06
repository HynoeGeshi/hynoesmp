import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildHelpIndex, DEFAULT_HELP_SOURCES } from '../scripts/build-help-index.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('help index uses an explicit approved Hynoe source allowlist', async () => {
  const index = await buildHelpIndex({ rootDir, sources: DEFAULT_HELP_SOURCES });
  const pages = new Set(index.chunks.map((chunk) => chunk.page));
  for (const page of ['index.html','join.html','start.html','progression.html','economy.html','bosses.html','modpack.html','modded-minecraft-server.html','updates.html','mca.html','llms.txt','data/server-profile.json']) {
    assert.ok(pages.has(page), `missing approved source ${page}`);
  }
  for (const blocked of ['site-admin.html','chat-admin.html','privacy.html','terms.html','relay/worker.mjs','docs/superpowers/specs/2026-10-06-site-help-global-chat-design.md']) {
    assert.equal(pages.has(blocked), false, `blocked source leaked: ${blocked}`);
  }
});

test('HTML indexing strips scripts styles navigation forms and preserves useful headings/URLs', async () => {
  const index = await buildHelpIndex({ rootDir, sources: ['join.html','watch.html'] });
  const all = index.chunks.map((chunk) => chunk.text).join('\n');
  assert.doesNotMatch(all, /Content-Security-Policy|site-social-panel|function\s*\(|<script|outpost-jumps/i);
  assert.ok(index.chunks.some((chunk) => chunk.page === 'join.html' && chunk.url === '/join.html' && chunk.heading));
  assert.ok(index.chunks.some((chunk) => /join|server|modpack/i.test(`${chunk.title} ${chunk.heading} ${chunk.text}`)));
});

test('generated chunks are bounded, structured, tokenized and stable for unchanged input', async () => {
  const first = await buildHelpIndex({ rootDir, sources: ['llms.txt','data/server-profile.json','progression.html'] });
  const second = await buildHelpIndex({ rootDir, sources: ['llms.txt','data/server-profile.json','progression.html'] });
  assert.deepEqual(first, second);
  assert.ok(first.chunks.length > 5);
  for (const chunk of first.chunks) {
    assert.match(chunk.id, /^[a-f0-9]{16}$/);
    assert.ok(chunk.text.length > 0 && chunk.text.length <= 1400, chunk.id);
    assert.ok(Array.isArray(chunk.tokens) && chunk.tokens.length > 0, chunk.id);
    assert.equal(typeof chunk.url, 'string');
    assert.equal(typeof chunk.heading, 'string');
  }
});

test('knowledge artifact contains no browser/public configuration secrets or admin instructions', async () => {
  const index = await buildHelpIndex({ rootDir, sources: DEFAULT_HELP_SOURCES });
  const raw = JSON.stringify(index);
  assert.doesNotMatch(raw, /sb_secret_|service_role|BRIDGE_AUTH_SECRET|Private admin token/i);
  assert.doesNotMatch(raw, /site-admin\.html|chat-admin\.html|relay\/worker/i);
});
