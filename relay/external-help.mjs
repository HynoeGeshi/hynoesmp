const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const unavailable=()=>json({status:'unavailable'});
async function sha256(value){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');}
const safeText=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';
function safeContext(input){return {page:safeText(input?.page,80),sectionId:safeText(input?.sectionId,80),outpostRoom:safeText(input?.outpostRoom,60)};}
function safeSources(input){if(!Array.isArray(input))return [];const out=[];for(const source of input.slice(0,6)){try{const url=new URL(String(source?.url||''));if(url.protocol!=='https:')continue;out.push({title:safeText(source?.title||'External source',100)||'External source',url:url.href});if(out.length>=3)break;}catch{}}return out;}
export async function handleExternalHelp({request,env,storage,body,now=Date.now()}){
 const question=safeText(body?.question,501);if(!question||question.length>500)return json({error:'Use a question of 1–500 characters.'},400);
 const context=safeContext(body?.context||{});
 if(!env.HELP_PROVIDER_URL||!env.HELP_PROVIDER_KEY)return unavailable();
 let provider;try{provider=new URL(env.HELP_PROVIDER_URL);if(provider.protocol!=='https:')return unavailable();}catch{return unavailable();}
 const ip=request.headers.get('CF-Connecting-IP');if(!ip)return json({error:'Unable to verify your connection.'},403);
 const day=Math.floor(now/86400000),ipHash=await sha256(String(env.IP_SALT||'help')+'|help|'+day+'|'+ip),key='help:'+ipHash;
 const limited=await storage.transaction(async tx=>{let entry=await tx.get(key)||{window:now,count:0,expires:now+86400000};if(now-entry.window>=60000)entry={window:now,count:0,expires:now+86400000};if(entry.count>=12)return true;entry.count++;await tx.put(key,entry);return false;});
 if(limited)return json({error:'Ask Hynoe external lookup limit reached. Try again in a minute.'},429);
 try{
  const response=await fetch(provider.href,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+env.HELP_PROVIDER_KEY},body:JSON.stringify({question,context}),signal:AbortSignal.timeout(8000)});
  if(!response.ok)return unavailable();const data=await response.json(),answer=safeText(data?.answer,1200);if(!answer)return unavailable();return json({status:'external',answer,sources:safeSources(data?.sources)});
 }catch{return unavailable();}
}
