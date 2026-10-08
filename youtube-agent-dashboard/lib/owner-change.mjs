export const CHANGE_CHANNEL='31031ac7-034b-420f-b8ec-de9952669afa';
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
