import {handleExternalHelp} from './external-help.mjs';
const DAY=86400000;
const SESSION_TTL=DAY;
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
const ADJECTIVES=['Copper','Ember','Iron','Moss','Nova','Flint','Cedar','Brass','Rift','Wild'];
const NOUNS=['Fox','Wolf','Mole','Owl','Hawk','Bear','Otter','Lynx','Raven','Badger'];

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
 if(typeof b.text!=='string'||!b.text.trim()||b.text.length>240||/[\x00-\x1f\x7f\u00a7\u200b-\u200f\u202a-\u202e\u2066-\u2069]/u.test(b.text))throw Error('Use a single-line message of 1–240 characters.');
 if(/^\s*\//.test(b.text))throw Error('Chat only: commands are not allowed.');
 if(/(?:https?:\/\/|www\.|discord\.(?:gg|com)\/)/i.test(b.text))throw Error('Links are not allowed in public chat.');
 return {text:b.text.trim()};
}

export function validateCallsign(value){
 if(typeof value!=='string'||!/^[A-Za-z0-9_ -]{2,20}$/.test(value.trim()))throw Error('Use a callsign of 2–20 letters, numbers, spaces, underscores or hyphens.');
 const name=value.trim();
 if(RESERVED.test(name.replace(/[_-]/g,' ')))throw Error('Choose a callsign that does not imply staff status.');
 return name;
}

function generateCallsign(){const bytes=new Uint8Array(3);crypto.getRandomValues(bytes);return `${ADJECTIVES[bytes[0]%ADJECTIVES.length]}${NOUNS[bytes[1]%NOUNS.length]}-${10+(bytes[2]%90)}`;}
function bytesToBase64url(bytes){let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function textToBase64url(text){return bytesToBase64url(new TextEncoder().encode(text));}
function base64urlToBytes(value){let base=value.replace(/-/g,'+').replace(/_/g,'/');while(base.length%4)base+='=';const binary=atob(base),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes;}
function base64urlToText(value){return new TextDecoder().decode(base64urlToBytes(value));}
async function hmac(secret,data){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(data)));}
function sameBytes(a,b){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;}
async function issueSession(actorId,secret,now){const payload={v:1,sub:actorId,iat:now,exp:now+SESSION_TTL,nonce:crypto.randomUUID()};const encoded=textToBase64url(JSON.stringify(payload));return {token:`${encoded}.${bytesToBase64url(await hmac(secret,encoded))}`,expiresAt:payload.exp};}
async function verifySessionToken(token,secret,now){try{if(typeof token!=='string'||token.length>2048)return null;const parts=token.split('.');if(parts.length!==2)return null;const expected=await hmac(secret,parts[0]),actual=base64urlToBytes(parts[1]);if(!sameBytes(expected,actual))return null;const payload=JSON.parse(base64urlToText(parts[0]));if(payload?.v!==1||typeof payload.sub!=='string'||!Number.isFinite(payload.exp)||payload.exp<=now)return null;return payload;}catch{return null;}}

export function publicMessage(record){return {id:record.id,displayName:record.displayName,displayKind:record.displayKind||'guest',text:record.text,createdAt:record.createdAt??record.at};}
export function messageEvent(record){return {type:'message',message:publicMessage(record)};}
export function deleteEvent(id){return {type:'delete',id};}
export function statusEvent(paused){return {type:'status',paused:!!paused};}
export function mergePublicMessages(existing,incoming){const byId=new Map;for(const item of [...(existing||[]),...(incoming||[])])if(item?.id)byId.set(item.id,item);return [...byId.values()].sort((a,b)=>(a.createdAt||0)-(b.createdAt||0)||String(a.id).localeCompare(String(b.id)));}

async function hash(value){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function body(request){const reader=request.body?.getReader();if(!reader)throw Error('Missing request body.');let chunks=[],size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();throw Error('Request is too large.');}chunks.push(value);}const data=new Uint8Array(size);let pos=0;for(const c of chunks){data.set(c,pos);pos+=c.byteLength;}const parsed=JSON.parse(new TextDecoder().decode(data));if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error('Invalid request.');return parsed;}

export default {async fetch(request,env){
 const origin=request.headers.get('Origin')||'',allowed=(env.ALLOWED_ORIGINS||'https://hynoesmp.com,https://www.hynoesmp.com').split(',').map(x=>x.trim());
 const admin=new URL(request.url).pathname.startsWith('/admin');
 if((!admin||origin)&&!allowed.includes(origin))return fail('Origin is not allowed.',403);
 let response;
 if(request.method==='OPTIONS')response=new Response(null,{status:204});
 else try{const id=env.CHAT.idFromName('hynoe-community');response=await env.CHAT.get(id).fetch(request);}catch{response=fail('Community service unavailable.',503);}
 const headers=new Headers(response.headers);if(allowed.includes(origin))headers.set('Access-Control-Allow-Origin',origin);headers.set('Vary','Origin');headers.set('Access-Control-Allow-Methods','GET, POST, OPTIONS');headers.set('Access-Control-Allow-Headers','Content-Type, Authorization');
 const init={status:response.status,statusText:response.statusText,headers};if(response.webSocket)init.webSocket=response.webSocket;return new Response(response.body,init);
}};

export class ChatRoom{
 constructor(ctx,env){this.ctx=ctx;this.env=env;this.sockets=new Set();}
 broadcast(event){const encoded=JSON.stringify(event);for(const socket of [...this.sockets]){try{socket.send(encoded);}catch{this.sockets.delete(socket);}}}
 socketResponse(request){
  if((request.headers.get('Upgrade')||'').toLowerCase()!=='websocket')return fail('WebSocket upgrade required.',426);
  if(typeof WebSocketPair==='undefined')return fail('Realtime transport unavailable.',501);
  const pair=new WebSocketPair(),client=pair[0],server=pair[1];server.accept();this.sockets.add(server);const cleanup=()=>this.sockets.delete(server);server.addEventListener('close',cleanup);server.addEventListener('error',cleanup);return new Response(null,{status:101,webSocket:client});
 }
 async alarm(){const s=this.ctx.storage,now=Date.now(),rows=await s.list();for(const [k,v] of rows){if(k==='messages')await s.put(k,(v||[]).filter(m=>(m.at??m.createdAt)>now-DAY));else if(k==='reports')await s.put(k,(v||[]).filter(m=>m.at>now-DAY));else if((k.startsWith('ip:')||k.startsWith('mute:')||k.startsWith('actor:')||k.startsWith('actor-rate:')||k.startsWith('help:'))&&v.expires<=now)await s.delete(k);}await s.setAlarm(now+3600000);}
 async verified(token,ip,origin){if(typeof token!=='string'||!token||token.length>2048)return false;try{const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:this.env.TURNSTILE_SECRET,response:token,remoteip:ip}),signal:AbortSignal.timeout(6000)});const data=await r.json();return data.success===true&&data.hostname===new URL(origin).hostname;}catch{return false;}}
 async guest(request,now){const auth=request.headers.get('Authorization')||'';if(!auth.startsWith('Guest '))return null;const payload=await verifySessionToken(auth.slice(6),this.env.SESSION_SECRET,now);if(!payload)return null;const actor=await this.ctx.storage.get('actor:'+payload.sub);if(!actor||actor.actorId!==payload.sub||actor.expires<=now)return null;return actor;}
 async fetch(request){
  const path=new URL(request.url).pathname,s=this.ctx.storage,now=Date.now();if(!await s.getAlarm())await s.setAlarm(now+3600000);if(path.startsWith('/admin'))return this.admin(request,path);if(path==='/help/external'&&request.method==='POST'){let b;try{b=await body(request);}catch{return fail('Invalid or oversized request.');}return handleExternalHelp({request,env:this.env,storage:s,body:b,now});}
  const configured=!!(this.env.TURNSTILE_SECRET&&this.env.IP_SALT&&this.env.SESSION_SECRET);
  if(path==='/socket'&&request.method==='GET')return this.socketResponse(request);
  if(path==='/messages'&&request.method==='GET'){const messages=(await s.get('messages')||[]).filter(m=>(m.at??m.createdAt)>now-DAY).map(publicMessage).sort((a,b)=>a.createdAt-b.createdAt||String(a.id).localeCompare(String(b.id)));return json({enabled:configured&&this.env.CHAT_ENABLED==='true'&&!(await s.get('paused')),messages});}
  if(request.method!=='POST'||!['/session','/session/name','/messages','/report'].includes(path))return fail('Not found.',404);if(!configured)return fail('Chat is awaiting owner setup.',503);
  let b;try{b=await body(request);}catch{return fail('Invalid or oversized request.');}const ip=request.headers.get('CF-Connecting-IP');if(!ip)return fail('Unable to verify your connection.',403);const origin=request.headers.get('Origin');
  if(path==='/session'){if(b.consent!==true)return fail('Accept the public-chat rules first.');if(!await this.verified(b.token,ip,origin))return fail('Verification expired or failed. Please complete it again.',403);const actorId=crypto.randomUUID(),callsign=generateCallsign(),expires=now+SESSION_TTL,actor={actorId,callsign,createdAt:now,lastSeen:now,expires};await s.put('actor:'+actorId,actor);const issued=await issueSession(actorId,this.env.SESSION_SECRET,now);return json({token:issued.token,callsign,expiresAt:issued.expiresAt},201);}
  const actor=await this.guest(request,now);if(!actor)return fail('Guest session is invalid or expired.',401);
  if(path==='/session/name'){let callsign;try{callsign=validateCallsign(b.name);}catch(e){return fail(e.message);}actor.callsign=callsign;actor.lastSeen=now;actor.expires=Math.max(actor.expires,now+3600000);await s.put('actor:'+actor.actorId,actor);return json({ok:true,callsign});}
  let message;if(path==='/messages'){try{message=validateMessage(b);}catch(e){return fail(e.message);}}
  const ipHash=await hash(this.env.IP_SALT+'|'+Math.floor(now/DAY)+'|'+ip);
  const reservation=await s.transaction(async tx=>{if(path==='/messages'&&(this.env.CHAT_ENABLED!=='true'||await tx.get('paused')))return 'Chat is paused.';const mute=await tx.get('mute:'+actor.actorId);if(mute&&mute.expires>now)return 'This guest is muted.';const actorKey='actor-rate:'+actor.actorId,entry=await tx.get(actorKey)||{at:0,count:0,window:now,expires:now+DAY};if(now-entry.at<15000)return 'Please wait 15 seconds between requests.';if(now-entry.window>3600000){entry.window=now;entry.count=0;}if(entry.count>=120)return 'Hourly chat limit reached. Take a break and try again later.';const ipKey='ip:'+ipHash,ipEntry=await tx.get(ipKey)||{at:0,count:0,window:now,expires:now+DAY};if(now-ipEntry.window>3600000){ipEntry.window=now;ipEntry.count=0;}if(ipEntry.count>=120)return 'Hourly chat limit reached. Take a break and try again later.';const global=await tx.get('global')||{at:0};if(path==='/messages'&&now-global.at<3000)return 'The chat is busy. Try again in a few seconds.';await tx.put(actorKey,{...entry,at:now,count:entry.count+1,expires:now+DAY});await tx.put(ipKey,{...ipEntry,at:now,count:ipEntry.count+1,expires:now+DAY});if(path==='/messages')await tx.put('global',{at:now});return null;});
  if(reservation)return fail(reservation,reservation.includes('muted')?403:429);
  if(path==='/report')return s.transaction(async tx=>{const messages=await tx.get('messages')||[];if(!messages.some(m=>m.id===b.id&&(m.at??m.createdAt)>now-DAY))return fail('Message no longer available.',404);let reports=(await tx.get('reports')||[]).filter(r=>r.at>now-DAY);if(!reports.some(r=>r.id===b.id&&r.by===actor.actorId))reports.push({id:b.id,by:actor.actorId,at:now});await tx.put('reports',reports.slice(-500));return json({ok:true});});
  if(await s.get('paused')||(await s.get('mute:'+actor.actorId))?.expires>now)return fail('Chat is paused or this guest is muted.',403);const moderation=moderateMessage(message.text);if(moderation.action==='block')return fail('Message blocked by community safety rules.',400);
  const stamp=Date.now(),record={id:crypto.randomUUID(),actorId:actor.actorId,displayName:actor.callsign,displayKind:'guest',text:moderation.text,createdAt:stamp,at:stamp};await s.transaction(async tx=>{let list=(await tx.get('messages')||[]).filter(m=>(m.at??m.createdAt)>now-DAY);list.push(record);await tx.put('messages',list.slice(-100));});actor.lastSeen=now;await s.put('actor:'+actor.actorId,actor);const event=messageEvent(record);this.broadcast(event);return json({ok:true,status:'published',message:event.message},201);
 }
 async admin(request,path){const secret=this.env.ADMIN_TOKEN;if(!secret||request.headers.get('Authorization')!=='Bearer '+secret)return fail('Unauthorized.',401);const s=this.ctx.storage,now=Date.now();
  if(request.method==='GET'&&path==='/admin')return json({paused:!!await s.get('paused'),messages:(await s.get('messages')||[]).filter(m=>(m.at??m.createdAt)>now-DAY).map(publicMessage),reports:(await s.get('reports')||[]).filter(r=>r.at>now-DAY).map(({by,...r})=>r)});
  if(request.method!=='POST')return fail('Not found.',404);let b;try{b=await body(request);}catch{return fail('Invalid request.');}
  if(path==='/admin/pause'){if(typeof b.paused!=='boolean')return fail('A boolean paused value is required.');await s.put('paused',b.paused);this.broadcast(statusEvent(b.paused));return json({ok:true});}
  if(path==='/admin/delete'||path==='/admin/mute')return s.transaction(async tx=>{const list=await tx.get('messages')||[],message=list.find(m=>m.id===b.id);if(!message)return fail('Message not found.',404);if(path==='/admin/mute'){if(!message.actorId)return fail('This legacy message cannot be identity-muted.',409);await tx.put('mute:'+message.actorId,{expires:now+DAY});const removed=list.filter(m=>m.actorId===message.actorId),removedIds=new Set(removed.map(m=>m.id));await tx.put('messages',list.filter(m=>m.actorId!==message.actorId));await tx.put('reports',(await tx.get('reports')||[]).filter(r=>!removedIds.has(r.id)));for(const item of removed)this.broadcast(deleteEvent(item.id));}else{await tx.put('messages',list.filter(m=>m.id!==b.id));await tx.put('reports',(await tx.get('reports')||[]).filter(r=>r.id!==b.id));this.broadcast(deleteEvent(b.id));}return json({ok:true});});
  return fail('Not found.',404);
 }
}
