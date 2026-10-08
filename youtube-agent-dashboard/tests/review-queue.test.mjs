import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as core from '../lib/dashboard-core.mjs';

const rows = [
  ...Array.from({length:13}, (_,i)=>({id:`pending-${i}`,approval_state:'pending',render_status:'pending'})),
  ...Array.from({length:4}, (_,i)=>({id:`approved-${i}`,approval_state:'approved',render_status:'ready',preview_uri:`approved-${i}.mp4`})),
  ...Array.from({length:4}, (_,i)=>({id:`rejected-${i}`,approval_state:'rejected',render_status:'ready',preview_uri:`rejected-${i}.mp4`})),
];

test('review summary separates 13 waiting, four approved and four rejected without mutating records',()=>{
  assert.equal(typeof core.reviewQueue, 'function');
  const original=structuredClone(rows);
  const queue=core.reviewQueue(rows);
  assert.deepEqual(queue.counts,{ready:0,awaiting:13,approved:4,rejected:4,attention:0});
  assert.equal(queue.active.length,17);
  assert.equal(queue.rejected.length,4);
  assert.ok(queue.active.every(row=>row.approval_state!=='rejected'));
  assert.deepEqual(rows,original);
});

test('ready review requires pending approval, ready render, and a preview reference',()=>{
  assert.equal(typeof core.reviewQueue,'function');
  const queue=core.reviewQueue([
    {approval_state:'pending',render_status:'ready',preview_uri:'a.mp4'},
    {approval_state:'pending',render_status:'ready',render_uri:'b.mp4'},
    {approval_state:'pending',render_status:'ready'},
    {approval_state:'pending',render_status:'failed',render_error_message:'Failed'},
    {approval_state:'pending',render_status:'rendering'},
    {approval_state:'pending',render_status:'unknown'},
    {approval_state:'approved',render_status:'ready',preview_uri:'c.mp4'},
    {approval_state:'rejected',render_status:'ready',preview_uri:'d.mp4'},
  ]);
  assert.deepEqual(queue.counts,{ready:2,awaiting:1,approved:1,rejected:1,attention:3});
  assert.deepEqual(core.reviewQueue([]).counts,{ready:0,awaiting:0,approved:0,rejected:0,attention:0});
});

class Element {
  constructor(tag='div'){this.tagName=tag;this.children=[];this.listeners={};this.dataset={};this.textContent='';this.open=false;this.classList={add(){},remove(){}};}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=[...children];}
  addEventListener(type,fn){this.listeners[type]=fn;}
  querySelector(){return null;}
  load(){}
}
const flatten = element => [element,...element.children.flatMap(flatten)];

async function boot(data){
  const ids=Object.fromEntries(['authPanel','reviewPanel','candidateList','rejectedHistory','rejectedSummary','rejectedList','status','loginForm','signOut'].map(id=>[id,new Element()]));
  let current=data; let authCallback; const signs=[];
  const supabase={
    from(){return{select:async()=>({data:current,error:null})};},
    storage:{from(){return{createSignedUrl:async path=>{signs.push(path);return {data:{signedUrl:'https://example.invalid/preview'},error:null};}};}},
    rpc:async(_name,args)=>{current=current.map(row=>row.id===args.p_clip_id?{...row,approval_state:'rejected'}:row);return{data:{},error:null};},
    auth:{getSession:async()=>({data:{session:{}}}),onAuthStateChange(fn){authCallback=fn;},signOut(){},signInWithPassword(){}}
  };
  const source=(await readFile(new URL('../public/app.mjs',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
  const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
  const names=['createClient',...Object.keys(core),'document','window'];
  await new AsyncFunction(...names,source)(()=>supabase,...Object.values(core),{querySelector:selector=>ids[selector.slice(1)],createElement:tag=>new Element(tag)},{__HYNOE_YOUTUBE_AGENT_CONFIG__:{}});
  return{ids,signs,signOut:()=>authCallback('SIGNED_OUT',null)};
}

test('actual app separates rejected history and uses accurate counts on startup and sign out',async()=>{
  const {ids,signs,signOut}=await boot(rows);
  assert.equal(ids.candidateList.children.length,17);
  assert.equal(ids.rejectedList.children.length,4);
  assert.equal(ids.status.textContent,'0 ready to review · 13 awaiting render · 4 approved · 4 rejected');
  assert.equal(ids.rejectedHistory.open,false);
  assert.ok(!flatten(ids.rejectedList).some(node=>node.tagName==='button'&&['Approve','Reject','Review exact private upload'].includes(node.textContent)));
  signOut();
  assert.equal(ids.candidateList.children.length,0);
  assert.equal(ids.rejectedList.children.length,0);
});

test('rejecting a ready clip moves it out of active cards after refresh',async()=>{
  const {ids}=await boot([{id:'one',approval_state:'pending',render_status:'ready',preview_uri:'one.mp4'}]);
  const reject=flatten(ids.candidateList).find(node=>node.tagName==='button'&&node.textContent==='Reject');
  reject.listeners.click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(ids.candidateList.children.length,0);
  assert.equal(ids.rejectedList.children.length,1);
  assert.equal(ids.status.textContent,'0 ready to review · 0 awaiting render · 0 approved · 1 rejected');
});

test('history markup uses native collapsed disclosure',async()=>{
  const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
  assert.match(html,/<details\b[^>]*id="rejectedHistory"[^>]*>/);
  assert.doesNotMatch(html,/<details\b[^>]*\bopen(?:\s|=|>)/);
  assert.match(html,/<summary\b[^>]*id="rejectedSummary"/);
});

test('failed and missing previews show attention rather than promised rendering',async()=>{
  const {ids}=await boot([
    {id:'failed',approval_state:'pending',render_status:'failed',render_error_message:'Render failed'},
    {id:'missing',approval_state:'pending',render_status:'ready'},
  ]);
  assert.equal(ids.status.textContent,'0 ready to review · 0 awaiting render · 0 approved · 0 rejected · 2 need attention');
});
