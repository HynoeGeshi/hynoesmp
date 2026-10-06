import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildKnowledge} from '../scripts/build_hynoe_knowledge.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const expected=['index.html','start.html','mca.html','progression.html','economy.html','bosses.html','join.html','modpack.html','updates.html','modded-minecraft-server.html','community-rules.html'];

test('knowledge builder indexes every approved public Hynoe source and no admin source',async()=>{
  const entries=await buildKnowledge(root),paths=new Set(entries.map(x=>x.path));
  for(const path of expected)assert.ok(paths.has(path),`missing ${path}`);
  assert.equal(paths.has('chat-admin.html'),false);
  assert.ok(entries.every(x=>x.id&&x.title&&x.heading&&x.text&&Array.isArray(x.tokens)));
});

test('knowledge extraction excludes scripts CSP metadata and admin implementation noise',async()=>{
  const text=(await buildKnowledge(root)).map(x=>x.text).join(' ');
  assert.doesNotMatch(text,/Content-Security-Policy|ADMIN_TOKEN|BLOOM_API_KEY|addEventListener\(|document\.querySelector/i);
});

test('knowledge build is deterministic',async()=>{
  const a=await buildKnowledge(root),b=await buildKnowledge(root);
  assert.equal(JSON.stringify(a),JSON.stringify(b));
});

test('committed knowledge JSON matches generator output',async()=>{
  const generated=await buildKnowledge(root);const committed=JSON.parse(await readFile(resolve(root,'data/hynoe-knowledge.json'),'utf8'));
  assert.deepEqual(committed,generated);
});
