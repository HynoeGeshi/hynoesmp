import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const path = new URL('../creatorops/growth.js', import.meta.url);
async function api() {
  let source = '';
  try { source = await readFile(path, 'utf8'); } catch {}
  const context = vm.createContext({ URL });
  vm.runInContext(source, context);
  assert.ok(context.HynoeGrowth, 'Growth planner API must exist');
  return context.HynoeGrowth;
}
test('gross target rounds buyers upward', async()=>{
 const m=(await api()).calculate({target:1000,price:49,feePercent:0,reservePercent:0,conversionPercent:2});
 assert.equal(m.grossBuyers,21); assert.equal(m.grossVisits,1050);
});
test('fee and reserve target stays distinct from gross', async()=>{
 const m=(await api()).calculate({target:1000,price:50,feePercent:15,reservePercent:5,conversionPercent:2});
 assert.equal(m.grossBuyers,20); assert.equal(m.afterAllowanceBuyers,25); assert.equal(m.retainedPerOrder,40);
 assert.equal(m.bankCash,null);
});
test('cent-boundary calculation does not add a spurious buyer', async()=>{
 const m=(await api()).calculate({target:0.30,price:0.10,feePercent:0,reservePercent:0,conversionPercent:100});
 assert.equal(m.grossBuyers,3);
});
test('zero goal is valid and needs zero orders', async()=>{
 const m=(await api()).calculate({target:0,price:50,feePercent:0,reservePercent:0,conversionPercent:2});
 assert.equal(m.grossBuyers,0);
});
test('rejects invalid price, conversion and percentages', async()=>{
 const f=(await api()).calculate;
 const base={target:1000,price:50,feePercent:0,reservePercent:0,conversionPercent:2};
 for(const patch of [{price:0},{target:-1},{conversionPercent:0},{conversionPercent:101},{feePercent:100},{feePercent:60,reservePercent:40},{price:NaN},{target:Infinity},{target:''},{price:null}]) assert.throws(()=>f({...base,...patch}));
});
test('tracking tags use approved public https links without personal identifiers', async()=>{
 const s=(await api()).trackingUrl('https://example.com/offer','tiktok','launch_01','hook_01');
 const u=new URL(s); assert.equal(u.searchParams.get('utm_source'),'tiktok'); assert.equal(u.searchParams.get('utm_campaign'),'launch_01');
});
test('tracking builder rejects dangerous schemes and private links', async()=>{
 const f=(await api()).trackingUrl;
 for(const s of ['javascript:alert(1)','http://example.com','https://user:pass@example.com','https://example.com?token=abc','https://example.com/private#secret','https://localhost','https://127.0.0.1','https://example.com?email=private']) assert.throws(()=>f(s,'tiktok','launch','hook'));
 assert.throws(()=>f('https://example.com','tiktok','name@example.com','hook'));
});
test('launch readiness cannot be inferred from a handle', async()=>{
 const f=(await api()).readiness;
 assert.equal(f({}).ready,false);
 assert.equal(f({ownerApproval:true,offerApproved:true,rightsCleared:true,checkoutVerified:true,deliveryConfirmed:true}).ready,true);
 assert.equal(f({ownerApproval:'true',offerApproved:true,rightsCleared:true,checkoutVerified:true,deliveryConfirmed:true}).ready,false);
});
test('planner does not collect passwords or connect accounts', async()=>{
 const html=await readFile(new URL('../creatorops/growth.html',import.meta.url),'utf8').catch(()=> '');
 assert.match(html,/No passwords/); assert.match(html,/not enabled in Hynoe/); assert.match(html,/Clapper/);
 assert.doesNotMatch(html,/type=["']password|name=["'](?:token|secret|password)/i);
});
test('planner has no external data calls or persistent browser storage',async()=>{
 const source=await readFile(path,'utf8').catch(()=> '');
 assert.ok(source.length>0); assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|sendBeacon|eval\s*\(/);
});
