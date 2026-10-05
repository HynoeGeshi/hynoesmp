import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

const unsupportedClaims = [
  /#1\s+(?:best|ranked)/i,
  /\b99\.9+%\s+uptime\b/i,
  /\b\d+\s+players?\s+online\b/i,
];

test('generic modded-server landing page is crawlable and routes visitors to join', () => {
  const html = read('modded-minecraft-server.html');
  assert.match(html, /<link rel="canonical" href="https:\/\/hynoesmp\.com\/modded-minecraft-server\.html">/i);
  assert.match(html, /<h1[^>]*>[^<]*modded Minecraft server/i);
  assert.match(html, /modded Minecraft servers? to join/i);
  assert.match(html, /hynoesmp\.com/i);
  assert.match(html, /href="join\.html"/i);
  assert.match(html, /href="modpack\.html"/i);
  assert.match(html, /Java/i);
  assert.match(html, /Fabric/i);
  assert.doesNotMatch(html, /Bedrock support(?:ed)?/i);
  for (const claim of unsupportedClaims) assert.doesNotMatch(html, claim);
});

test('AI-readable server profile exposes stable canonical facts', () => {
  const llms = read('llms.txt');
  assert.match(llms, /https:\/\/hynoesmp\.com\//);
  assert.match(llms, /https:\/\/hynoesmp\.com\/join\.html/);
  assert.match(llms, /https:\/\/hynoesmp\.com\/modpack\.html/);
  assert.match(llms, /Server address:\s*hynoesmp\.com/i);

  const profile = JSON.parse(read('data/server-profile.json'));
  assert.equal(profile.name, 'Hynoe SMP');
  assert.equal(profile.serverAddress, 'hynoesmp.com');
  assert.equal(profile.edition, 'Java');
  assert.match(profile.loader, /Fabric/i);
  assert.equal(profile.canonicalUrl, 'https://hynoesmp.com/');
  assert.equal(profile.joinUrl, 'https://hynoesmp.com/join.html');
  assert.equal(profile.modpackUrl, 'https://hynoesmp.com/modpack.html');
});

test('site discovery surfaces point to the new acquisition page', () => {
  const target = 'modded-minecraft-server.html';
  assert.match(read('sitemap.xml'), new RegExp(`https://hynoesmp\\.com/${target}`));
  assert.match(read('index.html'), new RegExp(`href="${target}"`));
  assert.match(read('join.html'), new RegExp(`href="${target}"`));
});
