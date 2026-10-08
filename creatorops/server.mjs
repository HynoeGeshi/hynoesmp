import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, timingSafeEqual, createPrivateKey, sign as cryptoSign, randomBytes } from 'node:crypto';
import { generateStarterAudit } from './audit-engine.mjs';

const ROOT = fileURLToPath(new URL('./', import.meta.url));
// This directory also contains backend code. Publish only these browser files;
// admin.html and report.html must use their dedicated routes below.
const PUBLIC_ASSETS = new Set([
  'index.html', 'privacy.html', 'terms.html', 'growth.html',
  'creatorops.css', 'creatorops.js', 'admin.css', 'admin.js',
  'report.css', 'report.js', 'growth.css', 'growth.js'
]);
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.ico':'image/x-icon' };
const SECURITY_HEADERS = {
  'X-Content-Type-Options':'nosniff',
  'X-Frame-Options':'DENY',
  'Referrer-Policy':'strict-origin-when-cross-origin',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy':'same-origin',
  'Cross-Origin-Resource-Policy':'same-origin',
  'Strict-Transport-Security':'max-age=31536000; includeSubDomains',
  'Content-Security-Policy':"default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
};

function send(res,status,body,type='text/plain; charset=utf-8',extra={}) {
  res.writeHead(status, { 'Content-Type':type, 'Cache-Control':status===200?'public, max-age=300':'no-store', ...SECURITY_HEADERS, ...extra });
  res.end(body);
}
function sendJson(res,status,body,extra={}) { send(res,status,JSON.stringify(body),'application/json; charset=utf-8',{'Cache-Control':'no-store',...extra}); }
async function sendFile(res,filename,cache=true,extra={}) {
  try {
    const body = await readFile(join(ROOT,filename));
    send(res,200,body,MIME[extname(filename)]||'application/octet-stream',{...(cache?{}:{'Cache-Control':'no-store'}),...extra});
  } catch { send(res,404,'Not found'); }
}
function sha256(v){ return createHash('sha256').update(v).digest('hex'); }
function safeEqual(a,b){ const aa=Buffer.from(String(a)),bb=Buffer.from(String(b)); return aa.length===bb.length&&timingSafeEqual(aa,bb); }
function parseBasicAuth(h=''){ if(!h.startsWith('Basic '))return null; try{const d=Buffer.from(h.slice(6),'base64').toString('utf8');const i=d.indexOf(':');return i<0?null:{user:d.slice(0,i),password:d.slice(i+1)}}catch{return null} }
function getClientIp(req){ const f=req.headers['x-forwarded-for']; if(typeof f==='string'&&f)return f.split(',')[0].trim().slice(0,80); return(req.socket.remoteAddress||'unknown').slice(0,80); }
async function readJson(req,maxBytes=32768){ const chunks=[];let total=0;for await(const chunk of req){total+=chunk.length;if(total>maxBytes)throw Object.assign(new Error('payload_too_large'),{status:413});chunks.push(chunk)}try{return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}')}catch{throw Object.assign(new Error('invalid_json'),{status:400})} }
function clean(v,max){ return typeof v==='string'?v.trim().slice(0,max):''; }
function validateApplication(input){
  const data={creatorName:clean(input.creatorName,120),email:clean(input.email,254).toLowerCase(),primaryPlatform:clean(input.primaryPlatform,40),profileUrl:clean(input.profileUrl,500),goal:clean(input.goal,2000),bottleneck:clean(input.bottleneck,2000),revenue:clean(input.revenue,80)||'Prefer not to say',interest:clean(input.interest,120)||'Free audit only'};
  if(clean(input.company,200))return{error:'spam_detected'};
  if(!data.creatorName||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)||!data.primaryPlatform||!data.goal||!data.bottleneck)return{error:'invalid_fields'};
  try{const u=new URL(data.profileUrl);if(!['http:','https:'].includes(u.protocol))return{error:'invalid_fields'}}catch{return{error:'invalid_fields'}}
  return{data};
}
function newReportToken(){ return randomBytes(32).toString('base64url'); }
function validReportToken(token){ return /^[A-Za-z0-9_-]{43,128}$/.test(token); }

export function createCreatorOpsServer(options={}) {
  const config={
    gatewayUrl:options.gatewayUrl??process.env.CREATOROPS_GATEWAY_URL??'',
    signingKeyB64:options.signingKeyB64??process.env.CREATOROPS_SIGNING_KEY_B64??'',
    adminUser:options.adminUser??process.env.CREATOROPS_ADMIN_USER??'hynoe',
    adminPassword:options.adminPassword??process.env.CREATOROPS_ADMIN_PASSWORD??'',
    rateLimitMax:Number(options.rateLimitMax??process.env.CREATOROPS_RATE_LIMIT_MAX??6),
    rateLimitWindowMs:Number(options.rateLimitWindowMs??process.env.CREATOROPS_RATE_LIMIT_WINDOW_MS??600000),
    reportRateLimitMax:Number(options.reportRateLimitMax??process.env.CREATOROPS_REPORT_RATE_LIMIT_MAX??30)
  };
  const intakeBuckets=new Map();
  const reportBuckets=new Map();
  let privateKey=null;
  if(config.signingKeyB64){try{privateKey=createPrivateKey({key:Buffer.from(config.signingKeyB64,'base64'),format:'der',type:'pkcs8'})}catch{privateKey=null}}

  function isAdmin(req){ if(!config.adminPassword)return false;const p=parseBasicAuth(req.headers.authorization||'');return!!p&&safeEqual(p.user,config.adminUser)&&safeEqual(p.password,config.adminPassword); }
  function checkRate(req,buckets,max){const now=Date.now(),key=sha256(getClientIp(req)),e=buckets.get(key);if(!e||now-e.started>=config.rateLimitWindowMs){buckets.set(key,{started:now,count:1});return{ok:true}}e.count++;if(e.count>max)return{ok:false,retryAfter:Math.max(1,Math.ceil((config.rateLimitWindowMs-(now-e.started))/1000))};return{ok:true}}
  async function gateway(method,payload,operation){
    if(typeof options.gatewayFn==='function') return options.gatewayFn(method,payload,operation);
    if(!config.gatewayUrl||!privateKey)throw new Error('gateway_not_configured');
    const wirePayload=method==='GET'?undefined:payload;
    const body=wirePayload===undefined?'':JSON.stringify(wirePayload);
    const ts=String(Date.now());
    const message=`${ts}\n${method}\n${operation}\n${body}`;
    const signature=cryptoSign(null,Buffer.from(message),privateKey).toString('base64');
    const response=await fetch(config.gatewayUrl,{method,headers:{'content-type':'application/json','x-creatorops-ts':ts,'x-creatorops-operation':operation,'x-creatorops-signature':signature},body:method==='GET'?undefined:body,signal:AbortSignal.timeout(8000)});
    const text=await response.text();let parsed;try{parsed=JSON.parse(text)}catch{parsed={error:'invalid_upstream_response'}}
    return{status:response.status,body:parsed};
  }

  return createServer(async(req,res)=>{
    let path;
    try { const url=new URL(req.url||'/','http://localhost'); path=decodeURIComponent(url.pathname); }
    catch { sendJson(res,400,{error:'bad_request'}); return; }

    if(path==='/healthz'){sendJson(res,200,{ok:true,service:'hynoe-creatorops',gatewayConfigured:Boolean(typeof options.gatewayFn==='function'||(config.gatewayUrl&&privateKey)),adminConfigured:Boolean(config.adminPassword)});return}

    if(path==='/api/intake'){
      if(req.method!=='POST'){sendJson(res,405,{error:'method_not_allowed'},{Allow:'POST'});return}
      if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json')){sendJson(res,415,{error:'unsupported_media_type'});return}
      const rate=checkRate(req,intakeBuckets,config.rateLimitMax);if(!rate.ok){sendJson(res,429,{error:'rate_limited'},{'Retry-After':String(rate.retryAfter)});return}
      try{
        const input=await readJson(req);
        const v=validateApplication(input);
        if(v.error){sendJson(res,v.error==='spam_detected'?202:422,v.error==='spam_detected'?{ok:true}:{error:v.error});return}
        const report=generateStarterAudit(v.data);
        const token=newReportToken();
        const tokenHash=sha256(token);
        const expiresAt=new Date(Date.now()+30*24*60*60*1000).toISOString();
        const application={...v.data,userAgentHash:sha256(String(req.headers['user-agent']||'').slice(0,500))};
        const upstream=await gateway('POST',{application,report,tokenHash,expiresAt},'intake-with-report');
        if(upstream.status!==200&&upstream.status!==201){sendJson(res,502,{error:'intake_unavailable'});return}
        const duplicate=Boolean(upstream.body?.duplicate);
        sendJson(res,duplicate?200:201,{ok:true,duplicate,report:{url:`/creatorops/report/${token}`,expiresAt}});
      }catch(error){const status=Number(error?.status)||502;sendJson(res,status,{error:status===502?'intake_unavailable':error.message})}
      return;
    }

    if(path==='/api/public/metrics/hynoe-youtube'){
      if(req.method!=='GET'){sendJson(res,405,{error:'method_not_allowed'},{Allow:'GET'});return}
      try{const u=await gateway('GET',{key:'hynoe_youtube_case_study'},'public-metrics');sendJson(res,u.status,u.body)}catch{sendJson(res,503,{error:'metrics_unavailable'})}
      return;
    }

    const reportApiMatch=path.match(/^\/api\/report\/([^/]+)$/);
    if(reportApiMatch){
      if(req.method!=='GET'){sendJson(res,405,{error:'method_not_allowed'},{Allow:'GET'});return}
      const rate=checkRate(req,reportBuckets,config.reportRateLimitMax);if(!rate.ok){sendJson(res,429,{error:'rate_limited'},{'Retry-After':String(rate.retryAfter)});return}
      const token=reportApiMatch[1];
      if(!validReportToken(token)){sendJson(res,404,{error:'report_not_found'});return}
      try{const u=await gateway('POST',{tokenHash:sha256(token)},'report-read');if(u.status!==200){sendJson(res,404,{error:'report_not_found'});return}sendJson(res,200,u.body)}catch{sendJson(res,404,{error:'report_not_found'})}
      return;
    }

    if(path.startsWith('/api/admin/')||path==='/admin'||path==='/admin/'){
      if(!isAdmin(req)){send(res,401,'Authentication required','text/plain; charset=utf-8',{'WWW-Authenticate':'Basic realm="Hynoe CreatorOps Admin", charset="UTF-8"','Cache-Control':'no-store'});return}
      if(path==='/admin'||path==='/admin/'){await sendFile(res,'admin.html',false);return}
      if(path==='/api/admin/applications'){if(req.method!=='GET'){sendJson(res,405,{error:'method_not_allowed'},{Allow:'GET'});return}try{const u=await gateway('GET',undefined,'admin-list');sendJson(res,u.status,u.body)}catch{sendJson(res,502,{error:'admin_data_unavailable'})}return}
      if(path==='/api/admin/payments'){if(req.method!=='GET'){sendJson(res,405,{error:'method_not_allowed'},{Allow:'GET'});return}try{const u=await gateway('GET',undefined,'admin-payments');sendJson(res,u.status,u.body)}catch{sendJson(res,502,{error:'admin_payment_data_unavailable'})}return}
      if(path==='/api/admin/status'){if(req.method!=='PATCH'){sendJson(res,405,{error:'method_not_allowed'},{Allow:'PATCH'});return}try{const input=await readJson(req,4096);const id=clean(input.id,64),status=clean(input.status,20);if(!/^[0-9a-f-]{36}$/i.test(id)||!['new','reviewing','qualified','contacted','closed'].includes(status)){sendJson(res,422,{error:'invalid_fields'});return}const u=await gateway('PATCH',{id,status},'admin-status');sendJson(res,u.status,u.body)}catch{sendJson(res,502,{error:'admin_update_unavailable'})}return}
    }

    if(req.method!=='GET'&&req.method!=='HEAD'){send(res,405,'Method not allowed','text/plain; charset=utf-8',{Allow:'GET, HEAD'});return}

    const reportPageMatch=path.match(/^\/creatorops\/report\/([A-Za-z0-9_-]{43,128})$/);
    if(reportPageMatch){await sendFile(res,'report.html',false,{'X-Robots-Tag':'noindex, nofollow, noarchive'});return}
    if(path==='/'||path==='/creatorops'||path==='/creatorops/'||path==='/index.html'){await sendFile(res,'index.html');return}
    if(path==='/creatorops.css'){await sendFile(res,'creatorops.css');return}
    if(path==='/creatorops.js'){await sendFile(res,'creatorops.js');return}
    if(path.startsWith('/creatorops/')){const asset=path.slice('/creatorops/'.length);if(!PUBLIC_ASSETS.has(asset)){send(res,404,'Not found');return}await sendFile(res,asset);return}
    send(res,404,'Not found');
  });
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const port=Number(process.env.PORT||3000),host=process.env.HOST||'0.0.0.0';
  createCreatorOpsServer().listen(port,host,()=>console.log(`Hynoe CreatorOps listening on http://${host}:${port}`));
}
