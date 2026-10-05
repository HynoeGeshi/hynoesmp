import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../watch.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../assets/watch.css',import.meta.url),'utf8');

test('watch page keeps site pages and every game section reachable without duplicate hub buttons',()=>{
  assert.match(html,/class="site-pages"/);
  for(const href of ['start.html','mca.html','progression.html','economy.html','bosses.html','join.html','modpack.html']) assert.match(html,new RegExp(`href="${href}"`));
  assert.doesNotMatch(html,/class="simple-hub"/);
  assert.match(html,/class="mine-tab"/);
  for(const id of ['tab-operations','tab-leaderboard','tab-frontier','tab-crew','tab-research','tab-upgrades','tab-expeditions','tab-journal']) assert.match(html,new RegExp(`id="${id}"`));
  assert.doesNotMatch(css,/\.game-loop,\.room-grid,\.tabs,\.system-atlas\{display:none!important\}/);
  assert.match(css,/\/\* NAV ACCESS FIX 2026-10-05 \*\//);
});
