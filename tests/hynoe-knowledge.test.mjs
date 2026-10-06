import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildKnowledge,KNOWLEDGE_PAGES} from '../scripts/build_hynoe_knowledge.mjs';

const root=new URL('..',import.meta.url).pathname;

test('knowledge builder is deterministic and covers every official player-facing source',async()=>{
 const a=await buildKnowledge(root),b=await buildKnowledge(root);
 assert.deepEqual(a,b);
 assert.ok(a.length>KNOWLEDGE_PAGES.length);
 const paths=new Set(a.map(x=>x.path));
 for(const path of KNOWLEDGE_PAGES)assert.ok(paths.has(path),`missing ${path}`);
 for(const entry of a){
  assert.equal(typeof entry.id,'string');assert.equal(typeof entry.title,'string');assert.equal(typeof entry.heading,'string');assert.equal(typeof entry.text,'string');assert.ok(Array.isArray(entry.tokens));
 }
});

test('knowledge excludes admin, scripts, styles, metadata and implementation-only text',async()=>{
 const entries=await buildKnowledge(root),blob=JSON.stringify(entries);
 assert.doesNotMatch(blob,/chat-admin\.html|Content-Security-Policy|BLOOM_API_KEY|SESSION_SECRET|github-actions|<script|<style/i);
 assert.doesNotMatch(blob,/docs\/superpowers|relay\/worker/i);
});

test('builder strips hidden and executable text in a synthetic page',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'hynoe-knowledge-'));
 try{
  for(const page of KNOWLEDGE_PAGES)await writeFile(join(dir,page),page==='index.html'?'<html><head><title>Test</title><script>PRIVATE_SCRIPT</script></head><body><section id="safe"><h2>Safe heading</h2><p>Visible answer text.</p><p hidden>HIDDEN_SECRET</p><style>.x{secret:yes}</style></section></body></html>':'<html><body><h1>'+page+'</h1><p>Public text for '+page+'</p></body></html>');
  const entries=await buildKnowledge(dir),blob=JSON.stringify(entries);
  assert.match(blob,/Visible answer text/);assert.doesNotMatch(blob,/PRIVATE_SCRIPT|HIDDEN_SECRET|secret:yes/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
