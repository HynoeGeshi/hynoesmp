import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from '../server.mjs';
test('metadata screen has an explicit no-store route and does not expose private batch files',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'hynoe-metadata-'));
 for(const [file,body] of [['metadata.html','metadata review'],['metadata.mjs','// authenticated client'],['batch.json','private']])await writeFile(join(dir,file),body);
 const server=createServer({publicDir:dir});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 try{
  for(const path of ['/metadata','/metadata.html','/metadata.mjs']){
   const r=await fetch(base+path);assert.equal(r.status,200,path);assert.equal(r.headers.get('cache-control'),'no-store');assert.match(r.headers.get('x-robots-tag'),/noindex/);
  }
  assert.equal((await fetch(base+'/batch.json')).status,404);
  assert.equal((await fetch(base+'/metadata',{method:'POST'})).status,405);
 }finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
