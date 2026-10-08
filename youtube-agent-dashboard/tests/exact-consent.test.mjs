import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareUploadReview,recordExactUploadApproval} from '../lib/dashboard-core.mjs';
test('exact review hashes rendered bytes, not lower-resolution preview; never uploads',async()=>{
 const clip={id:'clip',video_source_id:'source',start_ms:1,end_ms:2,score:99,render_status:'ready',render_uri:'render.mp4',preview_uri:'preview.mp4',title:'Exact title',description:'Exact description',hashtags:[]};
 const calls=[];
 const db={from(){return {select(){return {eq(){return {async single(){return {data:clip}}}}}}}},storage:{from(){return {async createSignedUrl(path){calls.push(path);return {data:{signedUrl:'https://private.test'}}}}}},async rpc(name,args){calls.push([name,args]);return {data:[{upload_approval_id:'approval',publishing_job_id:'job'}]}}};
 const package_=await prepareUploadReview(db,'clip',async()=>new Response('exact bytes'));
 assert.equal(calls[0],'render.mp4');assert.match(package_.media_sha256,/^[a-f0-9]{64}$/);assert.equal(package_.metadata.status.privacyStatus,'private');
 await assert.rejects(()=>recordExactUploadApproval(db,package_,'approved'),/Exact owner/);
 assert.equal(calls.length,1);
 await recordExactUploadApproval(db,package_,'I approve this exact YouTube upload');
 assert.equal(calls[1][0],'approve_clip_upload');assert.deepEqual(calls[1][1].p_package,package_);
});
test('90-point quality gate cannot be bypassed by generic approval',async()=>{
 const query={select(){return this},eq(){return this},async single(){return {data:{score:89,approved:true,auto_publish:true,render_status:'ready',render_uri:'x'}}}};
 const db={from(){return query}};
 await assert.rejects(()=>prepareUploadReview(db,'clip'),/90\+/);
});
