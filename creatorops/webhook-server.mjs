import { createServer } from 'node:http';
import { createHmac, createPrivateKey, sign as cryptoSign, timingSafeEqual } from 'node:crypto';

const SECURITY_HEADERS={
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff',
  'X-Frame-Options':'DENY',
  'Referrer-Policy':'no-referrer',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=()',
  'Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"
};
function send(res,status,body){res.writeHead(status,SECURITY_HEADERS);res.end(JSON.stringify(body))}
function safeEqualHex(a,b){try{const aa=Buffer.from(a,'hex'),bb=Buffer.from(b,'hex');return aa.length===bb.length&&aa.length>0&&timingSafeEqual(aa,bb)}catch{return false}}
async function readRaw(req,max=1024*1024){const chunks=[];let total=0;for await(const c of req){total+=c.length;if(total>max)throw Object.assign(new Error('payload_too_large'),{status:413});chunks.push(c)}return Buffer.concat(chunks).toString('utf8')}
function verifyStripeSignature(raw,header,secret,toleranceSec=300){if(!header||!secret)return false;const parts=Object.fromEntries(header.split(',').map(x=>x.split('=',2)));const ts=Number(parts.t),sig=parts.v1;if(!Number.isFinite(ts)||!sig||Math.abs(Math.floor(Date.now()/1000)-ts)>toleranceSec)return false;const expected=createHmac('sha256',secret).update(`${ts}.${raw}`).digest('hex');return safeEqualHex(sig,expected)}
function normalizeStripeEvent(event){const o=event?.data?.object||{};return{stripeEventId:String(event?.id||'').slice(0,120),eventType:String(event?.type||'').slice(0,120),stripeSessionId:typeof o.id==='string'?o.id.slice(0,120):'',stripeCustomerId:typeof o.customer==='string'?o.customer.slice(0,120):'',stripeSubscriptionId:typeof o.subscription==='string'?o.subscription.slice(0,120):'',product:['creatorops_system_build','creatorops_founding_monthly'].includes(o?.metadata?.product)?o.metadata.product:'unknown',amountTotal:Number.isFinite(Number(o.amount_total))?Math.max(0,Math.trunc(Number(o.amount_total))):null,currency:typeof o.currency==='string'?o.currency.slice(0,12):'',paymentStatus:typeof o.payment_status==='string'?o.payment_status.slice(0,80):''}}

export function createCreatorOpsWebhookServer(options={}){
  const gatewayUrl=options.gatewayUrl??process.env.CREATOROPS_GATEWAY_URL??'';
  const signingKeyB64=options.signingKeyB64??process.env.CREATOROPS_SIGNING_KEY_B64??'';
  const webhookSecret=options.webhookSecret??process.env.STRIPE_WEBHOOK_SECRET??'';
  let privateKey=null;try{if(signingKeyB64)privateKey=createPrivateKey({key:Buffer.from(signingKeyB64,'base64'),format:'der',type:'pkcs8'})}catch{privateKey=null}
  async function forward(payload){if(!gatewayUrl||!privateKey)throw new Error('gateway_not_configured');const method='POST',operation='stripe-event',body=JSON.stringify(payload),ts=String(Date.now()),message=`${ts}\n${method}\n${operation}\n${body}`,signature=cryptoSign(null,Buffer.from(message),privateKey).toString('base64');const r=await fetch(gatewayUrl,{method,headers:{'content-type':'application/json','x-creatorops-ts':ts,'x-creatorops-operation':operation,'x-creatorops-signature':signature},body,signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error(`gateway_${r.status}`)}
  return createServer(async(req,res)=>{
    const path=new URL(req.url||'/','http://localhost').pathname;
    if(path==='/healthz'){send(res,200,{ok:true,service:'hynoe-creatorops-webhook',configured:Boolean(gatewayUrl&&privateKey&&webhookSecret)});return}
    if(path!=='/stripe/webhook'){send(res,404,{error:'not_found'});return}
    if(req.method!=='POST'){send(res,405,{error:'method_not_allowed'});return}
    try{
      const raw=await readRaw(req);
      if(!verifyStripeSignature(raw,String(req.headers['stripe-signature']||''),webhookSecret)){send(res,400,{error:'invalid_signature'});return}
      let event;try{event=JSON.parse(raw)}catch{send(res,400,{error:'invalid_json'});return}
      const accepted=new Set(['checkout.session.completed','checkout.session.async_payment_succeeded']);
      if(!accepted.has(event?.type)){send(res,200,{received:true,ignored:true});return}
      const payload=normalizeStripeEvent(event);
      if(!payload.stripeEventId){send(res,400,{error:'invalid_event'});return}
      await forward(payload);
      send(res,200,{received:true});
    }catch(error){send(res,Number(error?.status)||500,{error:'webhook_unavailable'})}
  })
}

if(process.argv[1]===new URL(import.meta.url).pathname){
  const port=Number(process.env.PORT||3000),host=process.env.HOST||'0.0.0.0';
  createCreatorOpsWebhookServer().listen(port,host,()=>console.log(`CreatorOps webhook listening on ${host}:${port}`));
}
