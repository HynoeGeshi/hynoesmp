import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('watch page loads dedicated mobile layer and Hynoe Outpost branding', () => {
  const html = read('watch.html');
  assert.match(html, /assets\/watch-mobile\.css/);
  assert.match(html, /assets\/watch-mobile\.mjs/);
  assert.match(html, /HYNOE OUTPOST/);
  assert.doesNotMatch(html, /DEEP <em>&<\/em> DEEPER/);
});

test('mobile stylesheet gives phones usable mine grids, controls, tabs and mini-player', () => {
  assert.ok(existsSync(new URL('../assets/watch-mobile.css', import.meta.url)), 'watch-mobile.css must exist');
  const css = read('assets/watch-mobile.css');
  assert.match(css, /max-width:\s*479px/);
  assert.match(css, /grid-template-columns:\s*repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /min-width:\s*480px[^}]*max-width:\s*899px/s);
  assert.match(css, /grid-template-columns:\s*repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /\.vein[^}]*min-height:\s*(?:8[8-9]|9\d|1\d\d)px/s);
  assert.match(css, /touch-action:\s*manipulation/);
  assert.match(css, /scroll-snap-type:\s*x\s+proximity/);
  assert.match(css, /scroll-snap-align:\s*start/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test('touch input layer prevents one touch from becoming two mines while preserving keyboard clicks', () => {
  assert.ok(existsSync(new URL('../assets/watch-mobile.mjs', import.meta.url)), 'watch-mobile.mjs must exist');
  const js = read('assets/watch-mobile.mjs');
  assert.match(js, /pointerup/);
  assert.match(js, /pointerType\s*===\s*['"]touch['"]/);
  assert.match(js, /pointerType\s*===\s*['"]pen['"]/);
  assert.match(js, /isPrimary/);
  assert.match(js, /detail\s*===\s*0/);
  assert.match(js, /MutationObserver/);
  assert.match(js, /dataset\.pointerMining/);
});

test('Hynoe Outpost save key migrates the legacy Deep and Deeper local save', () => {
  const js = read('assets/watch.mjs');
  assert.match(js, /KEY='hynoeOutpostV1'/);
  assert.match(js, /LEGACY_KEY='hynoeDeepDeeperV1'/);
  assert.match(js, /localStorage\.getItem\(LEGACY_KEY\)/);
  assert.match(js, /localStorage\.setItem\(KEY,JSON\.stringify\(state\)\)/);
});

test('homepage no longer advertises the retired Deep and Deeper game name', () => {
  const html = read('index.html');
  assert.match(html, /HYNOE<br>OUTPOST|Hynoe Outpost/i);
  assert.doesNotMatch(html, /DEEP<br>&amp; DEEPER/);
});

test('Outpost browser asset graph uses one fresh release token', () => {
  const sources = [
    read('watch.html'),
    read('assets/watch.mjs'),
    read('assets/watch-mobile.mjs'),
    read('assets/watch-game.mjs'),
  ];
  const versionRefs = sources.flatMap(source => [...source.matchAll(/(?:assets\/|\.\/)(?:watch(?:-mobile|-command|-game|-session|-progression)?\.(?:css|mjs)|save-recovery\.mjs)\?v=([0-9a-z]+)/g)]);
  assert.ok(versionRefs.length >= 10, 'the full Outpost entry graph must stay explicitly versioned');
  assert.deepEqual([...new Set(versionRefs.map(match => match[1]))], ['20261006b']);
});
