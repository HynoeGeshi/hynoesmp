import test from 'node:test';
import assert from 'node:assert/strict';
import { finishApprovedSchedule } from '../lib/approve-schedule.mjs';
test('one upload then exact scheduling; uncertain write gets GET-only inspection',async()=>{
 const calls=[];
 const client={functions:{async invoke(name,{body}){calls.push([name,body]);if(name==='youtube-upload-approved')return {data:{youtube_video_id:'Ab1Cd2Ef3Gh'}};if(body.operation==='prepare')return {data:{id:'request',state:'awaiting_review',package:{policy:{publish_at:body.target.publish_at},resource_id:body.resource_id}}};if(body.operation==='apply')return {data:{error:'uncertain'}};return {data:{ok:true,verified:true,state:'applied'}};}},async rpc(name){calls.push([name]);return {data:'approval'};}};
 await finishApprovedSchedule(client,{publishing_job_id:'job',upload_approval_id:'upload'},'2099-10-10T19:00:00.000Z');
 assert.equal(calls.filter(([n])=>n==='youtube-upload-approved').length,1);
 assert.equal(calls.filter(([n])=>n==='approve_clip_upload').length,0);
 assert.deepEqual(calls.filter(([n])=>n==='youtube-owner-change').map(([,b])=>b.operation),['prepare','apply','inspect']);
});
test('existing private upload is scheduled without another upload or clip approval',async()=>{
 const calls=[];
 const client={functions:{async invoke(name,{body}){calls.push([name,body]);return {data:body.operation==='prepare'?{id:'request',package:{resource_id:body.resource_id,policy:{publish_at:body.target.publish_at}}}:{ok:true,verified:true,state:'applied'}};}},async rpc(){return {data:'approval'};}};
 await finishApprovedSchedule(client,{publishing_job_id:'job',upload_approval_id:'upload'},'2099-10-10T19:00:00.000Z',{youtubeVideoId:'Ab1Cd2Ef3Gh'});
 assert.ok(calls.every(([n])=>n!=='youtube-upload-approved'));
});
test('past schedule fails before upload',async()=>{
 await assert.rejects(()=>finishApprovedSchedule({}, {}, '2000-01-01T00:00:00.000Z'),/future/);
});
