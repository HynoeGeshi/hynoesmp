import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('watch page cache-busts every interactive Outpost asset with the repair build',()=>{
  const html=read('watch.html');
  for(const asset of ['watch.css','watch-mobile.css','watch.mjs','watch-mobile.mjs']){
    assert.match(html,new RegExp(`assets/${asset.replace('.',String.raw`\.`)}\\?v=20261006d`));
  }
  assert.match(html,/assets\/leaderboard-live\.css\?v=20261006d/);
  assert.match(html,/assets\/leaderboard-live\.mjs\?v=20261006d/);
});

test('phone CSS explicitly keeps mining SVG artwork visible',()=>{
  const css=read('assets/watch-mobile.css');
  assert.match(css,/\.vein\s+\.ore-crystal[^}]*display:\s*block\s*!important[^}]*visibility:\s*visible\s*!important[^}]*opacity:\s*1\s*!important/s);
  assert.match(css,/\.vein\s+\.ore-crystal\s+svg[^}]*display:\s*block\s*!important[^}]*width:\s*100%\s*!important[^}]*height:\s*100%\s*!important/s);
});

test('site-wide leaderboard is readable for everyone but publishes only after explicit opt in',()=>{
  assert.ok(existsSync(new URL('../assets/leaderboard-live.mjs',import.meta.url)),'leaderboard live controller must exist');
  const js=read('assets/leaderboard-live.mjs');
  assert.match(js,/hynoeLegendOptInV1/);
  assert.match(js,/\/v1\/leaderboard/);
  assert.match(js,/method:\s*['"]POST['"]/);
  assert.match(js,/optedIn/);
  assert.match(js,/leader-opt-in/);
  assert.match(js,/data-deletion\.html/);
  assert.doesNotMatch(js,/localStorage\.setItem\(['"]hynoeLegendOptInV1['"],\s*['"]yes['"]\).*DOMContentLoaded/s,'consent must never be granted automatically on page load');
});

test('browser mobile verification proves ore artwork has rendered geometry',()=>{
  const browser=read('tests/browser-mobile.mjs');
  assert.match(browser,/ore-crystal\s+svg/);
  assert.match(browser,/getBoundingClientRect\(\)/);
  assert.match(browser,/mining artwork/i);
});
