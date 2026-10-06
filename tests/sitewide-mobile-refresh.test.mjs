import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const refreshedPages=[
  'index.html','start.html','mca.html','progression.html','economy.html','bosses.html','join.html',
  'modpack.html','updates.html','modded-minecraft-server.html','watch.html',
  'privacy.html','terms.html','data-deletion.html','community-rules.html',
];

test('every public page loads the final shared site refresh layer',()=>{
  for(const page of refreshedPages){
    assert.match(read(page),/assets\/site-refresh\.css\?v=20261006b/,`${page} is missing site-refresh.css`);
  }
});

test('watch page loads the phone layout override and on-site video controller',()=>{
  const html=read('watch.html');
  assert.match(html,/assets\/watch-mobile-v2\.css\?v=20261006b/);
  assert.match(html,/assets\/watch-video\.mjs\?v=20261006b/);
  assert.match(html,/id="video"/);
  assert.match(html,/class="play-broadcast"/);
});

test('mobile interaction layer preserves save recovery without manually double-firing taps',()=>{
  const js=read('assets/watch-mobile.mjs');
  assert.match(js,/save-recovery\.mjs/);
  assert.match(js,/recoveryResult\.recovered/);
  assert.doesNotMatch(js,/pointerup/);
  assert.doesNotMatch(js,/dataset\.pointerMining/);
  assert.doesNotMatch(js,/original\.call/);
});

test('phone mining override is flow based and keeps labels readable',()=>{
  const css=read('assets/watch-mobile-v2.css');
  assert.match(css,/\.mine-scene\.mine-v2[^{]*\{[^}]*height:\s*auto/s);
  assert.match(css,/\.vein-grid[^{]*\{[^}]*position:\s*relative/s);
  assert.match(css,/grid-template-columns:\s*repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/\.vein[^{]*\{[^}]*min-height:\s*12[0-9]px/s);
  assert.match(css,/\.vein strong[^{]*\{[^}]*font-size:\s*1[2-9]px/s);
  assert.match(css,/\.vein small[^{]*\{[^}]*font-size:\s*1[0-9]px/s);
});

test('primary homepage stream CTA stays on Hynoe instead of navigating to YouTube',()=>{
  const js=read('assets/stream.js');
  assert.match(js,/watchEl\.href=['"]watch\.html#video['"]/);
  assert.match(js,/watchEl\.textContent=['"]WATCH HERE ON HYNOE['"]/);
  assert.doesNotMatch(js,/watchEl\.href=data\.url/);
});

test('watch video module creates a privacy enhanced iframe on the Hynoe page',()=>{
  const js=read('assets/watch-video.mjs');
  assert.match(js,/youtube-nocookie\.com\/embed/);
  assert.match(js,/play-broadcast/);
  assert.match(js,/data\/stream\.json/);
  assert.match(js,/replaceChildren\(iframe\)/);
});
