import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const pages=['index.html','start.html','mca.html','progression.html','economy.html','bosses.html','join.html','modpack.html','updates.html','modded-minecraft-server.html','watch.html','privacy.html','terms.html','data-deletion.html','community-rules.html'];

test('every public page loads the same Hynoe Community shell and release token',()=>{
  for(const page of pages){const html=read(page);assert.match(html,/assets\/community\.css\?v=20261006e/,page);assert.match(html,/assets\/community-shell\.mjs\?v=20261006e/,page);}
});

test('every public page has one valid community-aware CSP',()=>{
  for(const page of pages){const html=read(page);const csp=html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i)?.[1];assert.ok(csp,`missing CSP in ${page}`);assert.match(csp,/default-src 'self'/,page);assert.match(csp,/script-src 'self' https:\/\/challenges\.cloudflare\.com/,page);assert.match(csp,/connect-src 'self'.*https:\/\/\*\.workers\.dev.*https:\/\/challenges\.cloudflare\.com/,page);assert.equal((csp.match(/script-src/g)||[]).length,1,`duplicate script-src in ${page}`);assert.equal((csp.match(/connect-src/g)||[]).length,1,`duplicate connect-src in ${page}`);assert.doesNotMatch(csp,/default-src\s*;/,page);}
});

test('watch page retires Minecraft server-chat copy',()=>{
  const html=read('watch.html');assert.doesNotMatch(html,/Server chat/i);assert.doesNotMatch(html,/SETUP PENDING/i);
});

test('community shell exposes Global Chat and Ask Hynoe without auto-opening',()=>{
  const js=read('assets/community-shell.mjs');assert.match(js,/Global Chat/);assert.match(js,/Ask Hynoe/);assert.match(js,/aria-expanded/);assert.doesNotMatch(js,/open\(\)\s*;\s*$/m);
});

test('community CSS includes mobile full-height sheet and closed pointer isolation',()=>{
  const css=read('assets/community.css');assert.match(css,/pointer-events:\s*none/);assert.match(css,/@media\s*\(max-width:\s*700px\)/);assert.match(css,/100dvh/);assert.match(css,/env\(safe-area-inset-bottom\)/);
});

test('public chat config contains only public feature configuration',()=>{
  const cfg=JSON.parse(read('data/chat-config.json'));assert.equal(typeof cfg.communityUrl,'string');assert.equal(typeof cfg.turnstileSiteKey,'string');assert.equal(typeof cfg.globalChatEnabled,'boolean');assert.equal(typeof cfg.askHynoeEnabled,'boolean');assert.equal(JSON.stringify(cfg).match(/secret|admin.token|api.key/i),null);
});
