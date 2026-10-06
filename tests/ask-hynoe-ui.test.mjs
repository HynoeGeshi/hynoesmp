import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('Ask Hynoe is a separate lazy community tab with local-only bounded history',()=>{
 const shell=read('assets/community-shell.mjs');
 assert.match(shell,/Ask Hynoe/);assert.match(shell,/data\.pane|dataset\.pane|askPane/);
 assert.ok(existsSync(new URL('../assets/ask-hynoe.mjs',import.meta.url)));
 const js=read('assets/ask-hynoe.mjs');
 assert.match(js,/hynoeAskHynoeHistoryV1/);
 assert.match(js,/slice\(-(?:20|25|30)\)/);
 assert.match(js,/data\/hynoe-knowledge\.json/);
 assert.match(js,/answerFromHynoe/);
 assert.match(js,/getContext/);
 assert.match(js,/textContent/);
 assert.doesNotMatch(js,/innerHTML\s*=/);
 assert.doesNotMatch(js,/hynoeCommunityGuestV1|\/messages/,'Ask Hynoe must not post into Global Chat');
});

test('Ask Hynoe visibly distinguishes official, external, and unverifiable answers',()=>{
 const js=read('assets/ask-hynoe.mjs');
 assert.match(js,/Official Hynoe/);
 assert.match(js,/External Minecraft\/mod info/);
 assert.match(js,/couldn.t verify|cannot verify/i);
 assert.match(js,/\/help\/external/);
});

test('Ask Hynoe only sends bounded question and non-sensitive page context to optional fallback',()=>{
 const js=read('assets/ask-hynoe.mjs');
 assert.match(js,/question\.slice\(0,500\)|slice\(0,500\)/);
 assert.match(js,/page/);assert.match(js,/section/);assert.match(js,/outpostRoom/);
 assert.doesNotMatch(js,/hynoeOutpostV1|hynoeDeepDeeperV1|localStorage\.getItem\(['"]hynoeOutpost/);
});
