import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { createHmac, generateKeyPairSync } from 'node:crypto';
import { createCreatorOpsWebhookServer } from '../creatorops/webhook-server.mjs';

async function start(server){server.listen(0,'127.0.0.1');await once(server,'listening');return `http://127.0.0.1:${server.address().port}`}
const webhookSecret='whsec_test_secret';
const {privateKey}=generateKeyPairSync('ed25519');
const signingKeyB64=privateKey.export({format:'der',type:'pkcs8'}).toString('base64');
let forwarded=null;
const gateway=createServer(async(req,res)=>{let body='';for await(const c of req)body+=c;forwarded={op:req.headers['x-creatorops-operation'],sig:req.headers['x-creatorops-signature'],body};res.writeHead(200,{'content-type':'application/json'});res.end('{"ok":true}')});
const gatewayUrl=await start(gateway);
const app=createCreatorOpsWebhookServer({gatewayUrl,signingKeyB64,webhookSecret});
const base=await start(app);

try{
  const event={id:'evt_test_1',type:'checkout.session.completed',data:{object:{id:'cs_test_1',customer:'cus_1',subscription:null,amount_total:49900,currency:'usd',payment_status:'paid',metadata:{product:'creatorops_system_build'}}}};
  const raw=JSON.stringify(event);const ts=Math.floor(Date.now()/1000);const sig=createHmac('sha256',webhookSecret).update(`${ts}.${raw}`).digest('hex');
  const ok=await fetch(`${base}/stripe/webhook`,{method:'POST',headers:{'content-type':'application/json','stripe-signature':`t=${ts},v1=${sig}`},body:raw});
  assert.equal(ok.status,200);assert.equal(forwarded.op,'stripe-event');assert.ok(forwarded.sig?.length>40);assert.match(forwarded.body,/evt_test_1/);
  const bad=await fetch(`${base}/stripe/webhook`,{method:'POST',headers:{'content-type':'application/json','stripe-signature':`t=${ts},v1=bad`},body:raw});
  assert.equal(bad.status,400);
  const health=await fetch(`${base}/healthz`);assert.equal(health.status,200);
}finally{app.close();gateway.close();await Promise.all([once(app,'close'),once(gateway,'close')]);}
console.log('creatorops Stripe webhook security contract passed');