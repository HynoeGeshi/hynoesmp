import test from 'node:test';
import assert from 'node:assert/strict';
const api=await import('../lib/owner-change.mjs').catch(()=>({}));
const requestId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',approvalId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
test('the owner change client supports exact review, recording, and application',()=>{
 for(const name of ['prepareExactChange','recordExactChange','applyExactChange'])assert.equal(typeof api[name],'function',`${name} is required`);
});
test('generic approval flags cannot initiate an apply request',async()=>{
 const calls=[];const client={functions:{invoke:async(...args)=>{calls.push(args);return{data:{ok:true,verified:true}};}}};
 await assert.rejects(()=>api.applyExactChange(client,{id:requestId,package:{approved:true,score:99,analytics_complete:true}},null),/recorded approval/i);
 assert.equal(calls.length,0);
});
test('owner recording sends the exact prepared package to the authenticated RPC',async()=>{
 const package_={action:'restore_week_upload_visibility',resource_id:'oNwQjlWj5S0',after:{privacyStatus:'public'}};
 let called;const client={rpc:async(...args)=>{called=args;return{data:approvalId};}};
 assert.equal(await api.recordExactChange(client,{id:requestId,package:package_},'I approve this exact YouTube change'),approvalId);
 assert.deepEqual(called,['approve_youtube_owner_change',{p_request_id:requestId,p_expected_package:package_,p_confirmation_text:'I approve this exact YouTube change'}]);
});
test('apply uses server request and approval identities without caller metadata or generic flags',async()=>{
 let called;const client={functions:{invoke:async(...args)=>{called=args;return{data:{ok:true,verified:true,state:'applied'}};}}};
 await api.applyExactChange(client,{id:requestId,package:{approved:true,title:'Caller data'}},approvalId);
 assert.deepEqual(called,['youtube-owner-change',{body:{channel_id:'31031ac7-034b-420f-b8ec-de9952669afa',operation:'apply',request_id:requestId,approval_id:approvalId}}]);
});
test('unverified writes never display as successful',async()=>{
 const client={functions:{invoke:async()=>({data:{ok:true,state:'applied'}})}};
 await assert.rejects(()=>api.applyExactChange(client,{id:requestId},approvalId),/verified/i);
});
test('preparation cannot apply or record consent automatically',async()=>{
 const calls=[];const client={functions:{invoke:async(...args)=>{calls.push(args);return{data:{id:requestId,package:{action:'channel_description'},state:'awaiting_review'}};}}};
 const request=await api.prepareExactChange(client,{action:'channel_description',resource_id:'UCjWR1CZVFkrVk3S-TRrOGGQ',target:{description:'Reviewed copy'}});
 assert.equal(request.state,'awaiting_review');assert.equal(calls.length,1);assert.equal(calls[0][1].body.operation,'prepare');
});
test('the live review-hold check requires a real server rejection of generic flags',async()=>{
 const client={functions:{invoke:async()=>({error:{context:{status:409,json:async()=>({error:'Exact recorded owner approval required'})}}})}};
 assert.deepEqual(await api.verifyReviewHold(client),{blocked:true});
 const unsafe={functions:{invoke:async()=>({data:{ok:true}})}};
 await assert.rejects(()=>api.verifyReviewHold(unsafe),/protection could not be verified/i);
});
