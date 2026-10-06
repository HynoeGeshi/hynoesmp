const DAY=86400000;
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const fail=(error,status=400)=>json({error},status);
const RESERVED=/\b(admin|administrator|moderator|mod|owner|hynoe|staff|system)\b/i;
const PROFANITY=/\b(fuck(?:ing|ed|er|s)?|shit(?:ty|s)?|bitch(?:es)?|asshole(?:s)?)\b/gi;
const SEVERE_PATTERNS=[
 /\bkill\s+(you|yourself|him|her|them)\b/i,
 /\b(shoot|stab|hurt)\s+(you|him|her|them)\b/i,
 /\b(child|kid|minor)\s+(porn|nudes?|sex)\b/i,
 /\b(?:free\s+nitro|verify\s+your\s+account|seed\s+phrase|wallet\s+recovery)\b/i,
 /\b(?:home\s+address|address\s+is)\b/i,
 /\b(?:n[i1]gg(?:er|a)|f[a@]gg(?:ot)?|k[i1]ke|ch[i1]nk)\b/i
];

export function normalizeForModeration(text){
 let s=String(text??'').normalize('NFKC').toLowerCase().normalize('NFKD').replace(/\p{M}/gu,'');
 s=s.replace(/[!|]/g,'i').replace(/[@4]/g,'a').replace(/[3]/g,'e').replace(/[1]/g,'i').replace(/[0]/g,'o').replace(/[5$]/g,'s').replace(/[7]/g,'t');
 s=s.replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 s=s.replace(/\bk\s+i\s+l\s+l\s+y\s+o\s+u\b/g,'kill you');
 s=s.replace(/\bk\s+i\s+l\s+l\s+y\s+o\s+u\s+r\s+s?\s+e\s+l\s+f\b/g,'kill yourself');
 return s;
}

export function moderateMessage(text){
 const normalized=normalizeForModeration(text);
 for(const pattern of SEVERE_PATTERNS){if(pattern.test(normalized))return {action:'block',text:String(text),reason:'severe-abuse'};pattern.lastIndex=0;}
 let censored=false;
 const safe=String(text).replace(PROFANITY,word=>{censored=true;return word[0]+'*'.repeat(Math.max(1,word.length-1));});
 PROFANITY.lastIndex=0;
 return {action:censored?'censor':'allow',text:safe};
}

export function validateMessage(b){
 if(!b||typeof b!=='object'||Array.isArray(b))throw Error('Invalid message.');
 if(b.consent!==true)throw Error('Accept the public-chat rules first.');
 if(typeof b.name!=='string'||!/^[A-Za-z0-9_ -]{2,20}$/.test(b.name.trim()))throw Error('Use a guest name of 2–20 letters, numbers, spaces, underscores or hyphens.');
 if(RESERVED.test(b.name.replace(/[_-]/g,' ')))throw Error('Choose a name that does not imply staff status.');
 if(typeof b.text!=='string'||!b.text.trim()||b.text.length>240||/[\x00-\x1f\x7f\u00a7\u200b-\u200f\u202a-\u202e\u2066-\u2069]/u.test(b.text))throw Error('Use a single-line message of 1–240 characters.');
 if(/^\s*\//.test(b.text))throw Error('Chat only: commands are not allowed.');
 if(/(?:https?:\/\/|www\.|discord\.(?:gg|com)\/)/i.test(b.text))throw Error('Links are not allowed in public chat.');
 return {name:b.name.trim(),text:b.text.trim()};
}

async function hash(value){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function body(request){const reader=request.body?.getReader();if(!reader)throw Error('Missing request body.');let chunks=[],size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();throw Error('Request is too large.');}chunks.push(value);}const data=new Uint8Array(size);let pos=0;for(const c of chunks){data.set(c,pos);pos+=c.byteLength;}const parsed=JSON.parse(new TextDecoder().decode(data));if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error('Invalid request.');return parsed;}

export default {async fetch(request,env){
 const origin=request.headers.get('Origin')||'',allowed=(env.ALLOWED_ORIGINS||'https://hynoesmp.com,https://www.hynoesmp.com').split(',').map(x=>x.trim());
 const admin=new URL(request.url).pathname.startsWith('/admin');
 if((!admin||origin)&&!allowed.includes(origin))return fail('Origin is not allowed.',403);
 let response;
 if(request.method==='OPTIONS')response=new Response(null,{status:204});
 else try{const id=env.CHAT.idFromName('hynoe-community');response=await env.CHAT.get(id).fetch(request);}catch{response=fail('Community service unavailable.',503);}
 const headers=new Headers(response.headers);if(allowed.includes(origin))headers.set('Access-Control-Allow-Origin',origin);headers.set('Vary','Origin');headers.set('Access-Control-Allow-Methods','GET, POST, OPTIONS');headers.set('Access-Control-Allow-Headers','Content-Type, Authorization');return new Response(response.body,{status:response.status,headers});
}};

export class ChatRoom{
 constructor(ctx,env){this.ctx=ctx;this.env=env;}
 async alarm(){const s=this.ctx.storage;const now=Date.now();const rows=await s.list();for(const [k,v] of rows){if(k==='messages')await s.put(k,(v||[]).filter(m=>m.at>now-DAY));else if(k==='reports')await s.put(k,(v||[]).filter(m=>m.at>now-DAY));else if((k.startsWith('ip:')||k.startsWith('mute:'))&&v.expires<=now)await s.delete(k);}await s.setAlarm(now+3600000);}
 async verified(token,ip,origin){if(typeof token!=='string'||!token||token.length>2048)return false;try{const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:this.env.TURNSTILE_SECRET,response:token,remoteip:ip}),signal:AbortSignal.timeout(6000)});const data=await r.json();return data.success===true&&data.hostname===new URL(origin).hostname;}catch{return false;}}
 async fetch(request){
  const path=new URL(request.url).pathname,s=this.ctx.storage,now=Date.now();
  if(!await s.getAlarm())await s.setAlarm(now+3600000);
  if(path.startsWith('/admin'))return this.admin(request,path);
  const configured=!!(this.env.TURNSTILE_SECRET&&this.env.IP_SALT);
  if(path==='/messages'&&request.method==='GET'){
   const messages=(await s.get('messages')||[]).filter(m=>m.at>now-DAY).map(({ipHash,...m})=>m);
   return json({enabled:configured&&this.env.CHAT_ENABLED==='true'&&!(await s.get('paused')),messages});
  }
  if(request.method!=='POST'||!['/messages','/report'].includes(path))return fail('Not found.',404);
  if(!configured)return fail('Chat is awaiting owner setup.',503);
  let b;try{b=await body(request);}catch{return fail('Invalid or oversized request.');}
  let message;if(path==='/messages'){try{message=validateMessage(b);}catch(e){return fail(e.message);}}
  const ip=request.headers.get('CF-Connecting-IP');if(!ip)return fail('Unable to verify your connection.',403);
  const ipHash=await hash(this.env.IP_SALT+'|'+Math.floor(now/DAY)+'|'+ip);
  const origin=request.headers.get('Origin');
  const reservation=await s.transaction(async tx=>{
   if(path==='/messages'&&(this.env.CHAT_ENABLED!=='true'||await tx.get('paused')))return 'Chat is paused.';
   const mute=await tx.get('mute:'+ipHash);if(mute&&mute.expires>now)return 'This visitor is muted.';
   const k='ip:'+ipHash,entry=await tx.get(k)||{at:0,count:0,window:now,expires:now+DAY};
   if(now-entry.at<15000)return 'Please wait 15 seconds between requests.';
   if(now-entry.window>3600000){entry.window=now;entry.count=0;}
   if(entry.count>=120)return 'Hourly chat limit reached. Take a break and try again later.';
   const global=await tx.get('global')||{at:0};if(path==='/messages'&&now-global.at<3000)return 'The chat is busy. Try again in a few seconds.';
   await tx.put(k,{...entry,at:now,count:entry.count+1,expires:now+DAY});if(path==='/messages')await tx.put('global',{at:now});return null;
  });
  if(reservation)return fail(reservation,429);
  if(!await this.verified(b.token,ip,origin))return fail('Verification expired or failed. Please complete it again.',403);
  if(path==='/report'){
   return s.transaction(async tx=>{const messages=await tx.get('messages')||[];if(!messages.some(m=>m.id===b.id&&m.at>now-DAY))return fail('Message no longer available.',404);let reports=(await tx.get('reports')||[]).filter(r=>r.at>now-DAY);if(!reports.some(r=>r.id===b.id&&r.by===ipHash))reports.push({id:b.id,by:ipHash,at:now});await tx.put('reports',reports.slice(-500));return json({ok:true});});
  }
  if(await s.get('paused')||(await s.get('mute:'+ipHash))?.expires>now)return fail('Chat is paused or this visitor is muted.',403);
  const moderation=moderateMessage(message.text);if(moderation.action==='block')return fail('Message blocked by community safety rules.',400);
  const record={name:message.name,text:moderation.text,id:crypto.randomUUID(),at:Date.now(),ipHash};
  await s.transaction(async tx=>{let list=(await tx.get('messages')||[]).filter(m=>m.at>now-DAY);list.push(record);await tx.put('messages',list.slice(-100));});
  const {ipHash:privateHash,...publicMessage}=record;
  return json({ok:true,status:'published',message:publicMessage},201);
 }
 async admin(request,path){const secret=this.env.ADMIN_TOKEN;if(!secret||request.headers.get('Authorization')!=='Bearer '+secret)return fail('Unauthorized.',401);const s=this.ctx.storage,now=Date.now();
  if(request.method==='GET'&&path==='/admin')return json({paused:!!await s.get('paused'),messages:(await s.get('messages')||[]).filter(m=>m.at>now-DAY).map(({ipHash,...m})=>m),reports:(await s.get('reports')||[]).filter(r=>r.at>now-DAY).map(({by,...r})=>r)});
  if(request.method!=='POST')return fail('Not found.',404);let b;try{b=await body(request);}catch{return fail('Invalid request.');}
  if(path==='/admin/pause'){if(typeof b.paused!=='boolean')return fail('A boolean paused value is required.');await s.put('paused',b.paused);return json({ok:true});}
  if(path==='/admin/delete'||path==='/admin/mute')return s.transaction(async tx=>{const list=await tx.get('messages')||[],message=list.find(m=>m.id===b.id);if(!message)return fail('Message not found.',404);if(path==='/admin/mute')await tx.put('mute:'+message.ipHash,{expires:now+DAY});await tx.put('messages',list.filter(m=>path==='/admin/mute'?m.ipHash!==message.ipHash:m.id!==b.id));await tx.put('reports',(await tx.get('reports')||[]).filter(r=>r.id!==b.id));return json({ok:true});});
  return fail('Not found.',404);
 }
}
