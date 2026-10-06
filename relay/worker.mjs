const DAY=86400000,SESSION_TTL=12*60*60*1000;
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const fail=(error,status=400,reason)=>json({error,...(reason?{reason}:{})},status);

const STAFF_RE=/\b(admin|administrator|moderator|mod|owner|hynoe|system|staff)\b/i;
const PROFANITY=[
 {stem:'fuck',normalized:/\bfuck(?:ing|ed|er|ers|s)?\b/i,display:/\bfuck(?:ing|ed|er|ers|s)?\b/gi},
 {stem:'shit',normalized:/\bshit(?:ty|ting|ted|s)?\b/i,display:/\bshit(?:ty|ting|ted|s)?\b/gi},
 {stem:'bitch',normalized:/\bbitch(?:es|ing|y)?\b/i,display:/\bbitch(?:es|ing|y)?\b/gi},
 {stem:'asshole',normalized:/\basshole(?:s)?\b/i,display:/\basshole(?:s)?\b/gi},
 {stem:'damn',normalized:/\bdamn(?:ed|ing)?\b/i,display:/\bdamn(?:ed|ing)?\b/gi}
];
const SEVERE=[
 {reason:'hateful-abuse',re:/\bnigger\b/i},{reason:'hateful-abuse',re:/\bfaggot\b/i},
 {reason:'threat-or-self-harm-abuse',re:/\bkill\s+yourself\b/i},{reason:'threat-or-self-harm-abuse',re:/\bkys\b/i},
 {reason:'sexual-minor-content',re:/\b(?:child|minor|underage)\b.{0,24}\b(?:sex|sexual|nude|nudes|porn)\b/i},
 {reason:'doxxing',re:/\b(?:ssn|social security|home address|phone number)\b\s*[:=-]/i},
 {reason:'scam-or-phishing',re:/\b(?:verify your account|send me your password|gift card code|seed phrase)\b/i}
];
const LEET={0:'o',1:'i',3:'e',4:'a',5:'s',7:'t',8:'b','$':'s','@':'a'};

export function normalizeForModeration(input=''){
 let s=String(input).normalize('NFKC').toLowerCase();
 s=s.replace(/[0134578$@]/g,ch=>LEET[ch]||ch);
 s=s.replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g,'');
 s=s.replace(/([a-z])[^a-z0-9\s]+(?=[a-z])/g,'$1');
 return s.replace(/\s+/g,' ').trim();
}
const mask=m=>m[0]+'*'.repeat(Math.max(2,m.length-1));
export function moderateMessage(text=''){
 const original=String(text),normalized=normalizeForModeration(original);
 for(const rule of SEVERE){if(rule.re.test(normalized))return {action:'block',text:'',reason:rule.reason};}
 let out=original,changed=false;
 for(const rule of PROFANITY){
  if(!rule.normalized.test(normalized))continue;
  const before=out;out=out.replace(rule.display,mask);
  if(out===before){const chars=rule.stem.split('').map(ch=>ch.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));const evasion=new RegExp(`\\b${chars.join('[^A-Za-z0-9]*')}(?:ing|ed|er|ers|s|ty|ting|ted|es|y)?\\b`,'ig');out=out.replace(evasion,mask);}
  changed=changed||out!==before;
 }
 return {action:changed?'censor':'allow',text:out};
}
function validateName(name){if(typeof name!=='string'||!/^[A-Za-z0-9_ -]{2,20}$/.test(name.trim()))throw Error('Use a callsign of 2–20 letters, numbers, spaces, underscores or hyphens.');if(STAFF_RE.test(name.replace(/[_-]/g,' ')))throw Error('Choose a name that does not imply staff status.');return name.trim();}
export function validateMessage(b,actorName){
 if(!b||typeof b!=='object'||Array.isArray(b))throw Error('Invalid request.');
 if(b.consent!==true)throw Error('Accept the public-chat rules first.');
 const name=actorName?validateName(actorName):validateName(b.name);
 if(typeof b.text!=='string'||!b.text.trim()||b.text.length>240||/[\x00-\x1f\x7f\u00a7\u200b-\u200f\u202a-\u202e\u2066-\u2069]/u.test(b.text))throw Error('Use a single-line message of 1–240 characters.');
 if(/^\s*\//.test(b.text))throw Error('Chat only: commands are not allowed.');
 if(/(?:https?:\/\/|www\.|discord\.(?:gg|com)\/)/i.test(b.text))throw Error('Links are not allowed in public chat.');
 const moderated=moderateMessage(b.text.trim());if(moderated.action==='block'){const e=Error('That message cannot be posted.');e.reason=moderated.reason;throw e;}
 return {name,text:moderated.text,moderation:moderated.action};
}

const enc=new TextEncoder(),dec=new TextDecoder();
const b64url=bytes=>{let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
const unb64url=value=>{try{const s=atob(value.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((value.length+3)%4));return Uint8Array.from(s,c=>c.charCodeAt(0));}catch{return null;}};
async function hmac(secret,data){const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(data)));}
export async function signGuestSession(payload,secret){if(!secret)throw Error('Session secret is not configured.');const body=b64url(enc.encode(JSON.stringify(payload)));return body+'.'+b64url(await hmac(secret,body));}
function constantEqual(a,b){if(!a||!b||a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;}
export async function verifyGuestSession(token,secret,now=Date.now()){
 if(typeof token!=='string'||token.length>2048||!secret)return null;const [body,sig,...extra]=token.split('.');if(!body||!sig||extra.length)return null;
 const got=unb64url(sig),expected=await hmac(secret,body);if(!constantEqual(got,expected))return null;
 try{const payload=JSON.parse(dec.decode(unb64url(body)));if(!payload.actorId||!Number.isFinite(payload.expiresAt)||payload.expiresAt<=now)return null;return payload;}catch{return null;}
}
const ADJECTIVES=['Copper','Cinder','Quartz','Moss','Iron','Ember','Rift','Nova','Cedar','Flint'];
const NOUNS=['Wolf','Fox','Pick','Drill','Mole','Raven','Badger','Lantern','Anvil','Comet'];
export function generateCallsign(){const bytes=new Uint32Array(3);crypto.getRandomValues(bytes);return ADJECTIVES[bytes[0]%ADJECTIVES.length]+NOUNS[bytes[1]%NOUNS.length]+'-'+String(bytes[2]%90+10);}

async function hash(value){const digest=await crypto.subtle.digest('SHA-256',enc.encode(value));return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function body(request){const reader=request.body?.getReader();if(!reader)throw Error('Missing request body.');let chunks=[],size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();throw Error('Request is too large.');}chunks.push(value);}const data=new Uint8Array(size);let pos=0;for(const c of chunks){data.set(c,pos);pos+=c.byteLength;}const parsed=JSON.parse(dec.decode(data));if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error('Invalid request.');return parsed;}
const publicMessage=m=>({id:m.id,displayName:m.displayName,displayKind:m.displayKind||'guest',text:m.text,createdAt:m.createdAt});

export default {async fetch(request,env){
 const origin=request.headers.get('Origin')||'',allowed=(env.ALLOWED_ORIGINS||'https://hynoesmp.com,https://www.hynoesmp.com').split(',').map(x=>x.trim()),path=new URL(request.url).pathname,admin=path.startsWith('/admin');
 if((!admin||origin)&&!allowed.includes(origin))return fail('Origin is not allowed.',403);
 let response;if(request.method==='OPTIONS')response=new Response(null,{status:204});else try{const id=env.CHAT.idFromName('hynoe-global-chat');response=await env.CHAT.get(id).fetch(request);}catch{response=fail('Community chat is temporarily unavailable.',503);}
 const headers=new Headers(response.headers);if(allowed.includes(origin))headers.set('Access-Control-Allow-Origin',origin);headers.set('Vary','Origin');headers.set('Access-Control-Allow-Methods','GET, POST, OPTIONS');headers.set('Access-Control-Allow-Headers','Content-Type, Authorization');return new Response(response.body,{status:response.status,headers});
}};

export class ChatRoom{
 constructor(ctx,env){this.ctx=ctx;this.env=env;}
 async alarm(){const s=this.ctx.storage,now=Date.now(),rows=await s.list();for(const [k,v] of rows){if(k==='messages')await s.put(k,(v||[]).filter(m=>(m.createdAt||m.at||0)>now-DAY));else if(k==='reports')await s.put(k,(v||[]).filter(m=>m.at>now-DAY));else if((k.startsWith('ip:')||k.startsWith('mute:')||k.startsWith('mute-actor:'))&&v.expires<=now)await s.delete(k);else if(k.startsWith('actor:')&&v.lastSeen<now-DAY)await s.delete(k);}await s.setAlarm(now+3600000);}
 async verified(token,ip,origin){if(typeof token!=='string'||!token||token.length>2048)return false;try{const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:this.env.TURNSTILE_SECRET,response:token,remoteip:ip}),signal:AbortSignal.timeout(6000)});const data=await r.json();return data.success===true&&data.hostname===new URL(origin).hostname;}catch{return false;}}
 async guest(request){const auth=request.headers.get('Authorization')||'';if(!auth.startsWith('Guest '))return null;const payload=await verifyGuestSession(auth.slice(6),this.env.SESSION_SECRET);if(!payload)return null;const actor=await this.ctx.storage.get('actor:'+payload.actorId);if(!actor)return null;actor.lastSeen=Date.now();await this.ctx.storage.put('actor:'+actor.id,actor);return actor;}
 async createSession(request){
  if(!(this.env.TURNSTILE_SECRET&&this.env.IP_SALT&&this.env.SESSION_SECRET))return fail('Chat is awaiting owner setup.',503);let b;try{b=await body(request);}catch{return fail('Invalid request.');}
  const ip=request.headers.get('CF-Connecting-IP'),origin=request.headers.get('Origin');if(!ip)return fail('Unable to verify your connection.',403);if(!await this.verified(b.token,ip,origin))return fail('Verification expired or failed. Please complete it again.',403);
  const now=Date.now(),actor={id:crypto.randomUUID(),callsign:generateCallsign(),createdAt:now,lastSeen:now};await this.ctx.storage.put('actor:'+actor.id,actor);
  const expiresAt=now+SESSION_TTL,token=await signGuestSession({actorId:actor.id,issuedAt:now,expiresAt},this.env.SESSION_SECRET);return json({token,callsign:actor.callsign,expiresAt},201);
 }
 async fetch(request){
  const path=new URL(request.url).pathname,s=this.ctx.storage,now=Date.now();if(!await s.getAlarm())await s.setAlarm(now+3600000);if(path.startsWith('/admin'))return this.admin(request,path);
  if(path==='/session'&&request.method==='POST')return this.createSession(request);
  if(path==='/session/name'&&request.method==='POST'){const actor=await this.guest(request);if(!actor)return fail('Guest session is invalid or expired.',401);let b;try{b=await body(request);actor.callsign=validateName(b.name);}catch(e){return fail(e.message);}actor.lastSeen=now;await s.put('actor:'+actor.id,actor);return json({ok:true,callsign:actor.callsign});}
  const configured=!!(this.env.TURNSTILE_SECRET&&this.env.IP_SALT&&this.env.SESSION_SECRET);
  if(path==='/messages'&&request.method==='GET'){const messages=(await s.get('messages')||[]).filter(m=>(m.createdAt||m.at||0)>now-DAY).map(publicMessage);return json({enabled:configured&&this.env.CHAT_ENABLED==='true'&&!(await s.get('paused')),messages});}
  if(request.method!=='POST'||!['/messages','/report'].includes(path))return fail('Not found.',404);if(!configured)return fail('Chat is awaiting owner setup.',503);
  const actor=await this.guest(request);if(!actor)return fail('Guest session is invalid or expired.',401);let b;try{b=await body(request);}catch{return fail('Invalid or oversized request.');}
  let message;if(path==='/messages'){try{message=validateMessage(b,actor.callsign);}catch(e){return fail(e.message,400,e.reason);}}
  const ip=request.headers.get('CF-Connecting-IP');if(!ip)return fail('Unable to verify your connection.',403);const ipHash=await hash(this.env.IP_SALT+'|'+Math.floor(now/DAY)+'|'+ip);
  const reservation=await s.transaction(async tx=>{
   if(path==='/messages'&&(this.env.CHAT_ENABLED!=='true'||await tx.get('paused')))return 'Chat is paused.';
   const actorMute=await tx.get('mute-actor:'+actor.id);if(actorMute&&actorMute.expires>now)return 'This guest is muted.';
   const ipMute=await tx.get('mute:'+ipHash);if(ipMute&&ipMute.expires>now)return 'This connection is muted.';
   const k='ip:'+ipHash,entry=await tx.get(k)||{at:0,count:0,window:now,expires:now+DAY};if(now-entry.at<15000)return 'Please wait 15 seconds between requests.';if(now-entry.window>3600000){entry.window=now;entry.count=0;}if(entry.count>=120)return 'Hourly chat limit reached. Take a break and try again later.';
   const global=await tx.get('global')||{at:0};if(path==='/messages'&&now-global.at<3000)return 'The chat is busy. Try again in a few seconds.';await tx.put(k,{...entry,at:now,count:entry.count+1,expires:now+DAY});if(path==='/messages')await tx.put('global',{at:now});return null;
  });if(reservation)return fail(reservation,429);
  if(path==='/report')return s.transaction(async tx=>{const messages=await tx.get('messages')||[];if(!messages.some(m=>m.id===b.id&&(m.createdAt||m.at||0)>now-DAY))return fail('Message no longer available.',404);let reports=(await tx.get('reports')||[]).filter(r=>r.at>now-DAY);if(!reports.some(r=>r.id===b.id&&r.actorId===actor.id))reports.push({id:b.id,actorId:actor.id,at:now,reason:typeof b.reason==='string'?b.reason.slice(0,40):'report'});await tx.put('reports',reports.slice(-500));return json({ok:true});});
  const record={id:crypto.randomUUID(),actorId:actor.id,displayName:actor.callsign,displayKind:'guest',text:message.text,createdAt:Date.now(),at:Date.now(),ipHash,moderation:message.moderation};await s.transaction(async tx=>{let list=(await tx.get('messages')||[]).filter(m=>(m.createdAt||m.at||0)>now-DAY);list.push(record);await tx.put('messages',list.slice(-100));});return json({ok:true,message:publicMessage(record)},201);
 }
 async admin(request,path){const secret=this.env.ADMIN_TOKEN;if(!secret||request.headers.get('Authorization')!=='Bearer '+secret)return fail('Unauthorized.',401);const s=this.ctx.storage,now=Date.now();
  if(request.method==='GET'&&path==='/admin'){const messages=(await s.get('messages')||[]).filter(m=>(m.createdAt||m.at||0)>now-DAY),reports=(await s.get('reports')||[]).filter(r=>r.at>now-DAY);return json({paused:!!await s.get('paused'),messages:messages.map(m=>({...publicMessage(m),moderation:m.moderation})),reports:reports.map(({actorId,...r})=>r)});}
  if(request.method!=='POST')return fail('Not found.',404);let b;try{b=await body(request);}catch{return fail('Invalid request.');}
  if(path==='/admin/pause'){if(typeof b.paused!=='boolean')return fail('A boolean paused value is required.');await s.put('paused',b.paused);return json({ok:true});}
  if(path==='/admin/delete'||path==='/admin/mute')return s.transaction(async tx=>{const list=await tx.get('messages')||[],message=list.find(m=>m.id===b.id);if(!message)return fail('Message not found.',404);if(path==='/admin/mute'){if(message.actorId)await tx.put('mute-actor:'+message.actorId,{expires:now+DAY});await tx.put('mute:'+message.ipHash,{expires:now+DAY});}await tx.put('messages',list.filter(m=>path==='/admin/mute'?(message.actorId?m.actorId!==message.actorId:m.ipHash!==message.ipHash):m.id!==b.id));await tx.put('reports',(await tx.get('reports')||[]).filter(r=>r.id!==b.id));return json({ok:true});});
  return fail('Not found.',404);
 }
}
