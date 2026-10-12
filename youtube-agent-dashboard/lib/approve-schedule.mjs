const CHANNEL='31031ac7-034b-420f-b8ec-de9952669afa';
async function invoke(client,name,body){
 const {data,error}=await client.functions.invoke(name,{body});
 if(error||data?.error){let message=data?.error;try{message ||= (await error.context.json()).error;}catch{}throw Error(message||error?.message||'YouTube operation failed');}
 return data;
}
// A single owner click authorizes the displayed media/copy and selected time.
// Provider writes are never retried; uncertain scheduling is inspected read-only.
export async function finishApprovedSchedule(client,recorded,publishAt,{youtubeVideoId,onStatus=()=>{},sleep=ms=>new Promise(r=>setTimeout(r,ms))}={}){
 if(!Number.isFinite(Date.parse(publishAt))||Date.parse(publishAt)<=Date.now())throw Error('Choose a future publish time');
 if(!recorded.publishing_job_id||!recorded.upload_approval_id)throw Error('Recorded exact clip approval is required');
 let vid=youtubeVideoId;
 if(!vid){onStatus('Uploading privately…');const uploaded=await invoke(client,'youtube-upload-approved',recorded);vid=uploaded.youtube_video_id;}
 if(!/^[A-Za-z0-9_-]{11}$/.test(vid||''))throw Error('Upload identity could not be verified. Do not repeat the upload.');
 let request;
 for(let i=0;i<60;i++){
  onStatus('Waiting for YouTube processing, then scheduling… Keep this page open.');
  try{request=await invoke(client,'youtube-owner-change',{operation:'prepare',channel_id:CHANNEL,action:'schedule_approved_short',resource_id:vid,target:{...recorded,publish_at:publishAt}});break;}
  catch(error){if(!error.message.includes('Only a processed, unscheduled')||i===59)throw error;await sleep(10000);}
 }
 if(request.package?.resource_id!==vid||request.package?.policy?.publish_at!==publishAt)throw Error('Prepared schedule differs from your selection');
 const {data:approval,error}=await client.rpc('approve_youtube_owner_change',{p_request_id:request.id,p_expected_package:request.package,p_confirmation_text:'I approve this exact YouTube change'});
 if(error)throw error;
 const approvalId=typeof approval==='string'?approval:approval?.approval_id;
 onStatus('Applying your approved schedule…');
 const body={channel_id:CHANNEL,request_id:request.id,approval_id:approvalId};
 let result;
 try{result=await invoke(client,'youtube-owner-change',{operation:'apply',...body});if(!result.verified)throw Error('Readback required');}
 catch{result=await invoke(client,'youtube-owner-change',{operation:'inspect',...body});}
 if(result?.ok!==true||result.verified!==true||result.state!=='applied')throw Error('Schedule not verified. Inspect the existing upload before trying again.');
 onStatus('Scheduled: '+new Date(publishAt).toLocaleString());
 return {youtube_video_id:vid,publish_at:publishAt};
}
