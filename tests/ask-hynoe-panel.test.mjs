import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const panel=await readFile(new URL('../assets/site-social-panel.mjs',import.meta.url),'utf8');
const css=await readFile(new URL('../assets/site-social.css',import.meta.url),'utf8');

test('Ask Hynoe panel uses the private browser client rather than placeholder answers',()=>{
  assert.match(panel,/from ['"]\.\/ask-hynoe\.mjs['"]/);
  assert.match(panel,/askHynoe/);
  assert.match(panel,/appendPrivateHistory/);
  assert.doesNotMatch(panel,/Ask Hynoe is not answering yet|answer engine is being connected/i);
  assert.match(panel,/maxlength:\s*600/);
});

test('Ask Hynoe conversation remains separate from public chat and memory-only',()=>{
  assert.match(panel,/askHistory:\s*\[\]/);
  assert.match(panel,/never posted to Global Chat|not posted to Global Chat/i);
  assert.doesNotMatch(panel,/hynoeAskHistory|saveAskHistory|loadAskHistory/);
});

test('Ask Hynoe renders answer text, safe source links, confidence and loading states',()=>{
  assert.match(panel,/site-social-help-sources/);
  assert.match(panel,/site-social-help-confidence/);
  assert.match(panel,/ASKING|THINKING|WORKING/i);
  assert.match(panel,/result\.sources/);
  assert.match(panel,/result\.confidence/);
  assert.match(panel,/textContent/);
  assert.doesNotMatch(panel,/innerHTML\s*=/);
  assert.match(css,/\.site-social-help-sources/);
  assert.match(css,/\.site-social-help-confidence/);
});
