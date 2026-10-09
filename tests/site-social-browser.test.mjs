import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const ADMIN_PAGES = new Set(['site-admin.html', 'chat-admin.html']);
const PASSIVE_LEGAL_PAGES = new Set(['privacy.html', 'terms.html', 'data-deletion.html']);

async function htmlPages() {
  return (await readdir(root)).filter((name) => name.endsWith('.html'));
}

async function text(name) {
  return readFile(new URL(name, root), 'utf8');
}

test('public community pages load social assets while admin and legal pages remain excluded', async () => {
  for (const page of await htmlPages()) {
    const html = await text(page);
    if (ADMIN_PAGES.has(page) || PASSIVE_LEGAL_PAGES.has(page)) {
      assert.doesNotMatch(html, /site-social-panel\.mjs/i, `${page} must not mount visitor launcher`);
      continue;
    }
    assert.match(html, /assets\/site-social\.css\?v=20261007-minecraft/i, `${page} missing social CSS`);
    assert.match(html, /assets\/site-social-panel\.mjs\?v=20261008-language-filter/i, `${page} missing social panel module`);
    assert.match(html, /connect-src [^;]*https:\/\/hynoe-control-bridge\.onrender\.com/, `${page} blocks the Minecraft bridge`);
  }
});

test('legal notice pages stay readable without scripts, frames, or background community connections', async () => {
  for (const page of PASSIVE_LEGAL_PAGES) {
    const html = await text(page);
    assert.doesNotMatch(html, /<(?:script|iframe)\b/i, `${page} must stay passive`);
    assert.doesNotMatch(html, /site-social-panel\.mjs/i);
    assert.match(html, /script-src 'none'/);
    assert.match(html, /connect-src 'none'/);
    assert.match(html, /frame-src 'none'/);
    assert.match(html, /href="index\.html"/);
    assert.match(html, /href="community-rules\.html"/);
  }
});

test('shared panel exposes explicit Global Chat and Ask Hynoe tabs with accessible dialog behavior', async () => {
  const source = await text('assets/site-social-panel.mjs');
  assert.match(source, /GLOBAL CHAT/);
  assert.match(source, /ASK HYNOE/);
  assert.match(source, /MINECRAFT CHAT/);
  assert.match(source, /role[^\n]*dialog|setAttribute\(['"]role['"],\s*['"]dialog['"]\)/i);
  assert.match(source, /aria-modal/i);
  assert.match(source, /Escape/);
  assert.match(source, /Tab/);
  assert.match(source, /focus\(/);
  assert.match(source, /textContent/);
});

test('Global Chat sends on Enter while Shift+Enter keeps a line break', async () => {
  const source = `${await text('assets/site-social-panel.mjs')}\n${await text('assets/site-social.mjs')}`;
  assert.match(source, /addEventListener\(['"]keydown['"]/);
  assert.match(source, /event\.key\s*===?\s*['"]Enter['"]|event\.key\s*!==?\s*['"]Enter['"]/);
  assert.match(source, /event\.shiftKey/);
  assert.match(source, /requestSubmit\(\)/);
});

test('Ask Hynoe sends on Enter while Shift+Enter keeps a line break', async () => {
  const source = await text('assets/site-social-panel.mjs');
  assert.match(source, /askInput\.addEventListener\(['"]keydown['"]/);
  assert.match(source, /askForm\.requestSubmit\(\)/);
  assert.match(source, /askInput\.addEventListener\(['"]keydown['"][\s\S]*event\.shiftKey/);
});

test('social panel CSS supports mobile bottom sheet, visible composer, and reduced motion', async () => {
  const css = await text('assets/site-social.css');
  assert.match(css, /position\s*:\s*fixed/i);
  assert.match(css, /@media\s*\(max-width:\s*680px\)/i);
  assert.match(css, /100dvh|dvh/i);
  assert.match(css, /position\s*:\s*sticky/i);
  assert.match(css, /prefers-reduced-motion\s*:\s*reduce/i);
});

test('hidden community elements stay hidden even when their component class sets display', async () => {
  const css = await text('assets/site-social.css');
  assert.match(css, /\.site-social-panel\s+\[hidden\]\s*\{\s*display\s*:\s*none\s*!important\s*;?\s*\}/i);
});

test('Watch no longer contains or loads the retired Minecraft relay chat', async () => {
  const html = await text('watch.html');
  const js = await text('assets/watch.mjs');
  for (const source of [html, js]) {
    assert.doesNotMatch(source, /data\/chat-config\.json/i);
    assert.doesNotMatch(source, /\[WEB GUEST\]/i);
    assert.doesNotMatch(source, /id=["']campfire["']/i);
    assert.doesNotMatch(source, /Talk to the server/i);
    assert.doesNotMatch(source, /relayUrl/i);
  }
});

test('community rules describe website Global Chat moderation instead of Minecraft relay behavior', async () => {
  const html = await text('community-rules.html');
  assert.match(html, /Global Chat/i);
  assert.match(html, /report/i);
  assert.match(html, /mute|ban/i);
  assert.doesNotMatch(html, /broadcast to Minecraft/i);
});
