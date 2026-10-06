import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const pages=['index.html','start.html','mca.html','progression.html','economy.html','bosses.html','join.html','modpack.html','updates.html','modded-minecraft-server.html','watch.html','privacy.html','terms.html','data-deletion.html','community-rules.html'];

test('every public page loads one lazy Hynoe Community shell at release 20261006e',()=>{
 for(const page of pages){
  const html=read(page);
  assert.match(html,/assets\/community\.css\?v=20261006e/,`${page} missing community CSS`);
  assert.match(html,/assets\/community-shell\.mjs\?v=20261006e/,`${page} missing community shell`);
 }
});

test('old server-chat placeholder is removed from the Outpost',()=>{
 const html=read('watch.html');
 assert.doesNotMatch(html,/Server chat|SETUP PENDING/i);
 assert.match(html,/Hynoe Community|Global Chat/i);
});

test('community shell stays closed by default and lazy-loads chat and Ask Hynoe',()=>{
 assert.ok(existsSync(new URL('../assets/community-shell.mjs',import.meta.url)));
 const js=read('assets/community-shell.mjs');
 assert.match(js,/community-launcher/);
 assert.match(js,/Global Chat/);
 assert.match(js,/Ask Hynoe/);
 assert.match(js,/hidden\s*=\s*true|setAttribute\(['"]hidden/);
 assert.match(js,/import\(['"]\.\/global-chat\.mjs\?v=20261006e['"]\)/);
 assert.match(js,/import\(['"]\.\/ask-hynoe\.mjs\?v=20261006e['"]\)/);
 assert.doesNotMatch(js,/\.click\(\)/);
});

test('community CSS is mobile safe and closed state cannot intercept Outpost taps',()=>{
 const css=read('assets/community.css');
 assert.match(css,/pointer-events:\s*none/);
 assert.match(css,/\.community-panel[^}]*pointer-events:\s*auto/s);
 assert.match(css,/100dvh/);
 assert.match(css,/safe-area-inset-bottom/);
 assert.match(css,/max-width:\s*480px/);
 assert.match(css,/prefers-reduced-motion:\s*reduce/);
});

test('Global Chat uses safe DOM rendering, persistent guest and local block storage, and bounded polling fallback',()=>{
 const js=read('assets/global-chat.mjs');
 assert.match(js,/hynoeCommunityGuestV1/);
 assert.match(js,/hynoeCommunityBlocksV1/);
 assert.match(js,/textContent/);
 assert.doesNotMatch(js,/innerHTML\s*=/);
 assert.match(js,/WebSocket/);
 assert.match(js,/setInterval|setTimeout/);
 assert.match(js,/\/session\/name/);
 assert.match(js,/\/report/);
 assert.match(js,/Math\.min\([^)]*99/);
});

test('public chat config contains only public feature fields and no secret material',()=>{
 const config=JSON.parse(read('data/chat-config.json'));
 assert.deepEqual(Object.keys(config).sort(),['askHynoeEnabled','communityUrl','globalChatEnabled','turnstileSiteKey'].sort());
 for(const value of Object.values(config))assert.equal(/secret|token|password|bearer/i.test(String(value)),false);
});
