import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('homepage loads dedicated Hynoe world-hub visual layer', () => {
  const html = read('index.html');
  assert.match(html, /assets\/styles\.css[^>]*><link rel="stylesheet" href="assets\/home-outpost\.css/);
  assert.ok(existsSync(new URL('../assets/home-outpost.css', import.meta.url)), 'home-outpost.css must exist');
});

test('hero has exactly three dominant actions in the approved order', () => {
  const html = read('index.html');
  const hero = html.match(/<div class="hero-actions">([\s\S]*?)<\/div>/)?.[1] || '';
  const links = [...hero.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  assert.equal(links.length, 3);
  assert.deepEqual(links.map(x => x[1]), ['join.html','modpack.html','watch.html']);
  assert.match(links[0][2], /JOIN HYNOE SMP/);
  assert.match(links[1][2], /GET THE PACK/);
  assert.match(links[2][2], /WATCH &amp; PLAY|WATCH & PLAY/);
});

test('world dashboard routes visitors to real Hynoe SMP systems without fake telemetry', () => {
  const html = read('index.html');
  const dashboard = html.match(/<section class="world-dashboard"[\s\S]*?<\/section>/)?.[0] || '';
  assert.ok(dashboard, 'world-dashboard must exist');
  for (const href of ['progression.html','mca.html','economy.html','bosses.html']) assert.match(dashboard, new RegExp(`href="${href.replace('.', '\\.')}`));
  assert.match(dashboard, /GENESIS/i);
  assert.match(dashboard, /CAMPAIGN/i);
  assert.match(dashboard, /VILLAGE LIFE/i);
  assert.match(dashboard, /ECONOMY/i);
  assert.match(dashboard, /BOSSES|GEAR/i);
  assert.doesNotMatch(dashboard, /ONLINE PLAYERS|UPTIME|PLAYERS ONLINE|RATING/i);
});

test('homepage presents Hynoe Outpost as an original Hynoe game and preserves discovery/legal routes', () => {
  const html = read('index.html');
  assert.match(html, /Hynoe Outpost|HYNOE OUTPOST/i);
  assert.match(html, /original Hynoe browser game/i);
  assert.match(html, /mine[^<]*→[^<]*build[^<]*→[^<]*collect crew[^<]*→[^<]*explore[^<]*→[^<]*legacy/i);
  assert.match(html, /href="watch\.html#game"/);
  assert.match(html, /href="modded-minecraft-server\.html"/);
  assert.match(html, /not affiliated with Mojang or Microsoft/i);
});

test('homepage mobile layer is thumb-friendly and overflow-safe', () => {
  const css = read('assets/home-outpost.css');
  assert.match(css, /max-width:\s*600px/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /grid-template-columns:\s*1fr/);
  assert.match(css, /overflow-x:\s*(?:auto|hidden|clip)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
