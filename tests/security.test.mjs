import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir, readFile} from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('every public HTML page carries the browser security policy', async () => {
  const pages = (await readdir(root)).filter(name => name.endsWith('.html'));
  assert.ok(pages.length >= 10);
  for (const page of pages) {
    const html = await readFile(new URL(page, root), 'utf8');
    assert.match(html, /http-equiv="Content-Security-Policy"/i, page);
    assert.match(html, /object-src 'none'/, page);
    assert.match(html, /base-uri 'self'/, page);
    assert.match(html, /upgrade-insecure-requests/, page);
    assert.match(html, /name="referrer"/, page);
    assert.match(html, /Copyright © 2026 Hynoe/, page);
  }
});

test('new-tab links do not send opener access', async () => {
  const pages = (await readdir(root)).filter(name => name.endsWith('.html'));
  for (const page of pages) {
    const html = await readFile(new URL(page, root), 'utf8');
    for (const tag of html.match(/<a\b[^>]*target="_blank"[^>]*>/gi) || []) {
      assert.match(tag, /rel="[^"]*noreferrer[^"]*"/i, `${page}: ${tag}`);
    }
  }
});

test('public service configuration uses HTTPS and contains no private tokens', async () => {
  for (const name of ['data/leaderboard-config.json', 'data/site-social-config.json']) {
    const raw = await readFile(new URL(name, root), 'utf8');
    const value = JSON.parse(raw);
    for (const [key, entry] of Object.entries(value)) {
      if (!entry) continue;
      if (/url|endpoint/i.test(key)) assert.match(entry, /^https:\/\//, `${name}:${key}`);
      assert.doesNotMatch(key, /secret|password|admin.*token|api.*key/i, `${name}:${key}`);
    }
  }
});

test('proprietary game assets retain ownership notices', async () => {
  for (const name of ['assets/watch.mjs', 'assets/watch-game.mjs', 'assets/watch-progression.mjs', 'assets/watch.css']) {
    const source = await readFile(new URL(name, root), 'utf8');
    assert.match(source.slice(0, 180), /Copyright © 2026 Hynoe/, name);
  }
});
