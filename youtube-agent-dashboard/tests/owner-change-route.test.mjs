import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../server.mjs';
test('owner change review has explicit no-store routes with no POST server proxy',async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 try{
  for(const path of ['/changes','/changes.mjs','/owner-change.mjs','/change-drafts.mjs']){
   const response=await fetch(base+path);assert.equal(response.status,200,path);assert.equal(response.headers.get('cache-control'),'no-store');assert.match(response.headers.get('x-robots-tag'),/noindex/);
  }
  assert.equal((await fetch(base+'/changes',{method:'POST'})).status,405);
 }finally{await new Promise(r=>server.close(r));}
});
