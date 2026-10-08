export const CHANGE_CHANNEL='31031ac7-034b-420f-b8ec-de9952669afa';

export const COPY_LAYOUT_CONFIRMATION = 'I approve the exact copy and Home layout package [frozenv3+layoutv1]';
const COPY_ACTIONS = ['channel_description','channel_section','public_video_metadata','public_playlist_description'];
const YOUTUBE_CHANNEL = 'UCjWR1CZVFkrVk3S-TRrOGGQ';
function canonical(value) {
 if(Array.isArray(value))return value.map(canonical);
 if(value && typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));
 return value;
}
const equal = (left,right)=>JSON.stringify(canonical(left))===JSON.stringify(canonical(right));
const HOME_TYPES = new Map([
 ['singleplaylist','singlePlaylist'],['singlePlaylist','singlePlaylist'],
 ['multipleplaylists','multiplePlaylists'],['multiplePlaylists','multiplePlaylists'],
 ['completedevents','completedEvents'],['completedEvents','completedEvents']
]);
function homeSnippet(snippet) {
 const type=HOME_TYPES.get(snippet?.type);
 if(!type)throw Error('Prepared Home type does not match the approved target');
 return {...snippet,type};
}
const without = (value,keys)=>Object.fromEntries(Object.entries(value||{}).filter(([key])=>!keys.includes(key)));
function approvedScope(proposal) {
 if(!COPY_ACTIONS.includes(proposal?.action)||typeof proposal.resource_id!=='string'||!proposal.target)throw Error('Change is outside the approved scope');
 const target=proposal.target;
 const keys=Object.keys(target).sort();
 const expected=proposal.action==='public_video_metadata'?['description','title']:proposal.action==='channel_section'?['contentDetails','snippet']:['description'];
 if(!equal(keys,expected)||((proposal.action==='public_video_metadata'||proposal.action.endsWith('description'))&&typeof target.description!=='string'))throw Error('Change is outside the approved scope');
 if(proposal.action==='public_video_metadata'&&typeof target.title!=='string')throw Error('Change is outside the approved scope');
 if(proposal.action==='channel_section'&&(!target.snippet||!target.contentDetails||!HOME_TYPES.has(target.snippet.type)))throw Error('Change is outside the approved scope');
}
export function approvedCopyLayoutPlan(drafts,home) {
 if(drafts?.revision!=='hynoe-whole-channel-draft-2026-10-07-v3'||drafts.channel?.length!==1||drafts.videos?.length!==62||drafts.playlists?.length!==9||home?.length!==6)throw Error('Frozen approved copy/layout revision is required');
 const homeOrder=['home:survival','home:campaign-development','home:full-series','home:past-streams','home:zombies-sports','home:minecraft-shorts'];
 const orderedHome=homeOrder.map(key=>home.find(item=>item.key===key));
 if(orderedHome.some(item=>!item)||!equal(orderedHome.map(item=>item.target.snippet.position),[0,1,4,3,5,6]))throw Error('Frozen approved Home order is required');
 const plan=structuredClone([...drafts.channel,...orderedHome,...drafts.videos,...drafts.playlists]);
 if(new Set(plan.map(item=>item.action+':'+item.resource_id)).size!==78)throw Error('Approved package identities must be unique');
 for(const proposal of plan)approvedScope(proposal);
 return plan;
}
export function assertApprovedTarget(request,proposal) {
 approvedScope(proposal);
 const package_=request?.package, before=package_?.before, after=package_?.after, body=after?.body;
 if(!UUID.test(request?.id||'')||package_?.action!==proposal.action||package_?.resource_id!==proposal.resource_id||package_?.channel_id!==CHANGE_CHANNEL||package_?.youtube_channel_id!==YOUTUBE_CHANNEL||before?.owned_channel_id!==YOUTUBE_CHANNEL)throw Error('Prepared package does not match the approved target');
 let expected;
 if(proposal.action==='public_video_metadata') {
  if(before?.status?.privacyStatus!=='public')throw Error('Prepared package does not match the approved target');
  expected={api:'videos',part:'snippet',body:{id:proposal.resource_id,snippet:{...before.snippet,...proposal.target}}};
 } else if(proposal.action==='public_playlist_description') {
  if(before?.status?.privacyStatus!=='public')throw Error('Prepared package does not match the approved target');
  expected={api:'playlists',part:'snippet',body:{id:proposal.resource_id,snippet:{...before.snippet,description:proposal.target.description}}};
 } else if(proposal.action==='channel_description') {
  if(proposal.resource_id!==YOUTUBE_CHANNEL||!before?.brandingSettings?.channel)throw Error('Prepared package does not match the approved target');
  expected={api:'channels',part:'brandingSettings',body:{id:proposal.resource_id,brandingSettings:{channel:{...before.brandingSettings.channel,description:proposal.target.description}}}};
 } else {
  const isNew=proposal.resource_id.startsWith('new:');
  if(isNew?before?.exists!==false:!before?.snippet)throw Error('Prepared package does not match the approved target');
  if(!isNew&&homeSnippet(before.snippet).type!==homeSnippet(proposal.target.snippet).type)throw Error('Prepared Home type does not match the approved target');
  expected={api:'channelSections',part:'snippet,contentDetails',body:{...(isNew?{}:{id:proposal.resource_id}),snippet:{...(isNew?{}:before.snippet),...proposal.target.snippet},contentDetails:proposal.target.contentDetails}};
 }
 const matches=proposal.action==='channel_section'
  ?equal({...after,body:{...body,snippet:homeSnippet(body?.snippet)}},{...expected,body:{...expected.body,snippet:homeSnippet(expected.body.snippet)}})
  :equal(after,expected);
 if(!matches||!body)throw Error('Prepared package does not match the approved target');
 return true;
}
function unchanged(request) {
 const {action,before,after}=request.package;
 if(['public_video_metadata','public_playlist_description'].includes(action))return equal(before.snippet,after.body.snippet);
 if(action==='channel_description')return before.brandingSettings.channel.description===after.body.brandingSettings.channel.description;
 if(action==='channel_section')return before.exists!==false&&equal(homeSnippet(before.snippet),homeSnippet(after.body.snippet))&&equal(before.contentDetails,after.body.contentDetails);
 return false;
}
export async function inspectExactChange(client,request,approvalId) {
 if(!UUID.test(request?.id||'')||!UUID.test(approvalId||''))throw Error('Consumed exact owner receipt is required for inspection');
 const result=await invoke(client,{operation:'inspect',request_id:request.id,approval_id:approvalId});
 if(result?.ok!==true||result.verified!==true||result.state!=='applied')throw Error('Read-only inspection did not verify the exact applied change');
 return result;
}
async function originalOwner(client,ownerId,extraCheck) {
 if(!UUID.test(ownerId||''))throw Error('Original owner session is required');
 if(extraCheck)await extraCheck();
 const {data,error}=await client.auth.getSession();
 if(error||data?.session?.user?.id!==ownerId)throw Error('Original owner session changed');
 const {data:verified,error:ownerError}=await client.rpc('is_original_youtube_change_owner',{p_channel_id:CHANGE_CHANNEL});
 if(ownerError||verified!==true)throw Error('Original recorded owner is required');
}
async function readCopyReceipts(client) {
 const {data:requests,error:requestError}=await client.from('youtube_owner_change_requests')
  .select('id,channel_id,action,resource_id,package,state,result_resource_id,created_at').eq('channel_id',CHANGE_CHANNEL).in('action',COPY_ACTIONS).order('created_at',{ascending:false}).limit(1000);
 if(requestError||!Array.isArray(requests)||requests.length===1000)throw Error('Exact owner receipt history could not be safely loaded');
 if(!requests.length)return [];
 const {data:approvals,error:approvalError}=await client.from('youtube_owner_change_approvals')
  .select('id,request_id,channel_id,approved_by,package,approved_at,consumed_at,revoked_at').eq('channel_id',CHANGE_CHANNEL).in('request_id',requests.map(item=>item.id)).limit(1000);
 if(approvalError||!Array.isArray(approvals)||approvals.length===1000)throw Error('Exact recorded approval history could not be safely loaded');
 return requests.flatMap(request=>approvals.filter(approval=>approval.request_id===request.id).map(approval=>({request,approval})));
}
export async function runApprovedCopyLayout(client,proposals,options={}) {
 if(options.confirmation!==COPY_LAYOUT_CONFIRMATION)throw Error('Exact package consent is required');
 const plan=structuredClone(proposals);
 if(!Array.isArray(plan)||!plan.length)throw Error('Approved scope is empty');
 for(const proposal of plan)approvedScope(proposal);
 const result={completed:0,applied:0,unchanged:0,resumed:0,total:plan.length,paused:false};
 await originalOwner(client,options.ownerId,options.assertSession);
 const receipts=await readCopyReceipts(client);
 const emit=event=>options.onProgress?.({...result,...event});
 for(const [index,proposal] of plan.entries()) {
  if(options.shouldPause?.()){result.paused=true;emit({phase:'paused',index});return result;}
  await originalOwner(client,options.ownerId,options.assertSession);
  emit({phase:'preparing',index,proposal});
  let request,approvalId;
  const matching=receipts.find(receipt=>{
   const {request:r,approval:a}=receipt;
   if(r.action!==proposal.action||r.resource_id!==proposal.resource_id||a.approved_by!==options.ownerId||a.channel_id!==CHANGE_CHANNEL||!a.approved_at||a.revoked_at||!UUID.test(a.id||'')||!equal(a.package,r.package))return false;
   try{return assertApprovedTarget(r,proposal);}catch{return false;}
  });
  if(matching) {
   request=matching.request;approvalId=matching.approval.id;
   if(matching.approval.consumed_at) {
    if(!['applied','write_uncertain'].includes(request.state)||!request.result_resource_id)throw Error('Consumed change requires owner inspection before continuing');
    emit({phase:'inspecting',index,proposal,request,approvalId});
    try{await inspectExactChange(client,request,approvalId);}catch(error){throw Error('Read-only inspection unresolved; package stopped: '+error.message);}
    result.completed++;result.resumed++;emit({phase:'resumed',index,proposal,request,approvalId});continue;
   }
   if(request.state!=='awaiting_review')throw Error('Claimed change requires owner inspection before continuing');
   emit({phase:'approved',index,proposal,request,approvalId});
  } else {
   request=await prepareExactChange(client,{action:proposal.action,resource_id:proposal.resource_id,target:proposal.target});
   assertApprovedTarget(request,proposal);
   emit({phase:'prepared',index,proposal,request});
   if(unchanged(request)) {
    result.completed++;result.unchanged++;emit({phase:'unchanged',index,proposal,request});continue;
   }
   approvalId=await recordExactChange(client,request,CHANGE_CONFIRMATION);
   emit({phase:'approved',index,proposal,request,approvalId});
  }
  assertApprovedTarget(request,proposal);
  await originalOwner(client,options.ownerId,options.assertSession);
  emit({phase:'applying',index,proposal,request,approvalId});
  try {await applyExactChange(client,request,approvalId);}
  catch(error) {
   emit({phase:'inspecting',index,proposal,request,approvalId});
   try{await inspectExactChange(client,request,approvalId);}
   catch(inspectionError){throw Error('Public write will not be retried. Read-only inspection unresolved; package stopped: '+inspectionError.message);}
  }
  result.completed++;result.applied++;emit({phase:'applied',index,proposal,request,approvalId});
 }
 emit({phase:'complete',index:plan.length});
 return result;
}

export const CHANGE_CONFIRMATION='I approve this exact YouTube change';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
async function invoke(client,body){
 const {data,error}=await client.functions.invoke('youtube-owner-change',{body:{channel_id:CHANGE_CHANNEL,...body}});
 if(error){let message;try{message=(await error.context.json()).error;}catch{}throw Error(message||error.message||'Channel change failed');}
 if(data?.error)throw Error(data.error);
 return data;
}
export async function prepareExactChange(client,proposal){
 const request=await invoke(client,{operation:'prepare',...proposal});
 if(!UUID.test(request?.id||'')||!request?.package||request.state!=='awaiting_review')throw Error('Exact change request was not prepared');
 return request;
}
export async function recordExactChange(client,request,confirmation){
 if(confirmation!==CHANGE_CONFIRMATION||!UUID.test(request?.id||'')||!request?.package)throw Error('Exact review and owner confirmation are required');
 const {data,error}=await client.rpc('approve_youtube_owner_change',{p_request_id:request.id,p_expected_package:request.package,p_confirmation_text:confirmation});
 if(error)throw error;
 const id=typeof data==='string'?data:data?.approval_id;
 if(!UUID.test(id||''))throw Error('Exact approval was not recorded');
 return id;
}
export async function applyExactChange(client,request,approvalId){
 if(!UUID.test(request?.id||'')||!UUID.test(approvalId||''))throw Error('Exact recorded approval is required');
 const result=await invoke(client,{operation:'apply',request_id:request.id,approval_id:approvalId});
 if(result?.ok!==true||result.verified!==true||result.state!=='applied')throw Error('The change could not be verified. Check the channel before retrying.');
 return result;
}
export async function verifyReviewHold(client){
 const {error}=await client.functions.invoke('youtube-owner-change',{body:{channel_id:CHANGE_CHANNEL,operation:'apply',score:99,analytics_complete:true,approved:true,auto_publish:true,rank:1}});
 let body;try{body=await error?.context?.json();}catch{}
 if(error?.context?.status!==409||body?.error!=='Exact recorded owner approval required')throw Error('Approval protection could not be verified. No publication was requested.');
 return {blocked:true};
}
