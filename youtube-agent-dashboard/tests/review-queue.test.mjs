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
  append(...children){for(const child of children)child.parent=this;this.children.push(...children);}
  replaceChildren(...children){this.children=[...children];}
  addEventListener(type,fn){this.listeners[type]=fn;}
  querySelector(){return null;}
  load(){}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);}
}
const flatten = element => [element,...element.children.flatMap(flatten)];

async function boot(data,newline,overrides={}){
  const ids=Object.fromEntries(['authPanel','reviewPanel','candidateList','rejectedHistory','rejectedSummary','rejectedList','status','loginForm','signOut','refreshClips'].map(id=>[id,new Element()]));
  let current=data; let authCallback; const signs=[];const rpcCalls=[];
  const supabase={
    from(){return{select:async()=>({data:current,error:null})};},
    storage:{from(){return{createSignedUrl:async path=>{signs.push(path);return {data:{signedUrl:'https://example.invalid/preview'},error:null};}};}},
    rpc:async(name,args)=>{rpcCalls.push({name,args});current=current.map(row=>row.id===args.p_clip_id?{...row,approval_state:name==='approve_clip_upload'?'approved':'rejected'}:row);return{data:name==='approve_clip_upload'?[{upload_approval_id:'recorded',publishing_job_id:'job'}]:{},error:null};},
    auth:{getSession:async()=>({data:{session:{}}}),onAuthStateChange(fn){authCallback=fn;},signOut(){},signInWithPassword(){}}
  };
  const raw=await readFile(new URL('../public/app.mjs',import.meta.url),'utf8');
  const source=(newline?raw.replace(/\r?\n/g,newline):raw).replace(/^import .*;\r?\n/gm,'');
  const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
  const boundCore={...core,...overrides};
  const names=['createClient',...Object.keys(boundCore),'document','window'];
  await new AsyncFunction(...names,source)(()=>supabase,...Object.values(boundCore),{querySelector:selector=>ids[selector.slice(1)],createElement:tag=>new Element(tag)},{__HYNOE_YOUTUBE_AGENT_CONFIG__:{}});
  return{ids,signs,rpcCalls,setRows:rows=>{current=rows;},signOut:()=>authCallback('SIGNED_OUT',null)};
}
test('the actual app harness boots equivalent LF and Windows CRLF source',async()=>{
  for(const newline of ['\n','\r\n']){
    const {ids}=await boot(rows,newline);
    assert.equal(ids.candidateList.children.length,17);
    assert.equal(ids.rejectedList.children.length,4);
    assert.equal(ids.status.textContent,'0 ready to review · 13 awaiting render · 4 approved · 4 rejected');
  }
});

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

test('ready cards expose straightforward Approve and Reject without changing private playback',async()=>{
  const {ids,signs,rpcCalls}=await boot([{id:'ready',score:94,approval_state:'pending',render_status:'ready',preview_uri:'ready.mp4'}]);
  const nodes=flatten(ids.candidateList);
  assert.ok(nodes.some(node=>node.tagName==='button'&&node.textContent==='Approve'));
  assert.ok(nodes.some(node=>node.tagName==='button'&&node.textContent==='Reject'));
  const video=nodes.find(node=>node.tagName==='video');
  assert.equal(video.controls,true);assert.equal(video.playsInline,true);
  assert.equal(video.src,'https://example.invalid/preview');assert.deepEqual(signs,['ready.mp4']);
  assert.deepEqual(rpcCalls,[]);
});
test('Refresh clips loads newly ready media through read-only queries',async()=>{
  const app=await boot([{id:'one',approval_state:'pending',render_status:'pending'}]);
  app.setRows([{id:'one',score:94,approval_state:'pending',render_status:'ready',preview_uri:'one.mp4'}]);
  assert.equal(typeof app.ids.refreshClips.listeners.click,'function');
  app.ids.refreshClips.listeners.click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.ok(flatten(app.ids.candidateList).some(node=>node.tagName==='video'&&node.controls));
  assert.equal(app.ids.status.textContent,'1 ready to review · 0 awaiting render · 0 approved · 0 rejected');
  assert.deepEqual(app.signs,['one.mp4']);assert.deepEqual(app.rpcCalls,[]);
});
test('Refresh clips cannot load private cards after sign out',async()=>{
  const app=await boot([{id:'one',approval_state:'pending',render_status:'ready',preview_uri:'one.mp4'}]);
  app.signOut();
  assert.equal(typeof app.ids.refreshClips.listeners.click,'function');
  app.ids.refreshClips.listeners.click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(app.ids.candidateList.children.length,0);
  assert.equal(app.ids.status.textContent,'Sign in to review Shorts.');
  assert.deepEqual(app.rpcCalls,[]);
});
const exactPackage={clip_candidate_id:'one',video_source_id:'source',start_ms:1000,end_ms:2000,render_uri:'one.mp4',
  media_sha256:'a'.repeat(64),metadata:{snippet:{title:'Exact reviewed title',description:'Exact reviewed description',tags:[],categoryId:'20'},status:{privacyStatus:'private',selfDeclaredMadeForKids:false}}};
const readyReview={id:'one',score:94,approval_state:'pending',render_status:'ready',render_uri:'one.mp4',preview_uri:'one.mp4'};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function openReview(){
  const app=await boot([readyReview],undefined,{prepareUploadReview:async()=>structuredClone(exactPackage)});
  flatten(app.ids.candidateList).find(node=>node.tagName==='button'&&node.textContent==='Approve').listeners.click();
  await tick();return app;
}
test('Approve opens inline exact package review with unchecked consent and Cancel records nothing',async()=>{
  const app=await openReview();const nodes=flatten(app.ids.candidateList);
  const consent=nodes.find(node=>node.tagName==='input'&&node.type==='checkbox');
  assert.ok(consent);assert.equal(consent.checked,false);
  const confirm=nodes.find(node=>node.tagName==='button'&&node.textContent==='Confirm approval');
  assert.ok(confirm);assert.equal(confirm.disabled,true);confirm.listeners.click();await tick();assert.deepEqual(app.rpcCalls,[]);
  assert.ok(nodes.some(node=>node.tagName==='pre'&&node.textContent.includes(exactPackage.media_sha256)&&node.textContent.includes('Exact reviewed title')));
  nodes.find(node=>node.tagName==='button'&&node.textContent==='Cancel').listeners.click();await tick();
  assert.equal(flatten(app.ids.candidateList).some(node=>node.tagName==='input'&&node.type==='checkbox'),false);
  for(const name of ['Approve','Reject'])assert.equal(flatten(app.ids.candidateList).find(node=>node.tagName==='button'&&node.textContent===name).disabled,false);
  assert.deepEqual(app.rpcCalls,[]);
});
test('checked inline confirmation records only the exact reviewed private package',async()=>{
  const app=await openReview();const nodes=flatten(app.ids.candidateList);
  const consent=nodes.find(node=>node.tagName==='input'&&node.type==='checkbox');
  const confirm=nodes.find(node=>node.tagName==='button'&&node.textContent==='Confirm approval');
  assert.ok(consent&&confirm);consent.checked=true;consent.listeners.change();assert.equal(confirm.disabled,false);
  confirm.listeners.click();await tick();
  assert.deepEqual(app.rpcCalls,[{name:'approve_clip_upload',args:{p_clip_id:'one',p_package:exactPackage,p_confirmation_text:'I approve this exact YouTube upload'}}]);
});
test('a quality-held private preview plays for inspection while Approve stays disabled and Reject works',async()=>{
  const app=await boot([{...readyReview,render_status:'failed',render_error_message:'Quality hold: clean audio review required.'}]);
  const nodes=flatten(app.ids.candidateList);const video=nodes.find(node=>node.tagName==='video');
  assert.ok(video);assert.equal(video.src,'https://example.invalid/preview');
  const approve=nodes.find(node=>node.tagName==='button'&&node.textContent==='Approve');assert.equal(approve.disabled,true);
  approve.listeners.click();await tick();assert.deepEqual(app.rpcCalls,[]);
  assert.ok(nodes.some(node=>node.textContent==='Quality hold: clean audio review required.'));
  assert.equal(nodes.some(node=>node.textContent.startsWith('Render failed: Quality hold:')),false);
  assert.equal(app.ids.status.textContent,'0 ready to review · 0 awaiting render · 0 approved · 0 rejected · 1 need attention');
  nodes.find(node=>node.tagName==='button'&&node.textContent==='Reject').listeners.click();await tick();
  assert.equal(app.rpcCalls[0].name,'approve_clip');assert.equal(app.rpcCalls[0].args.p_action,'reject');
});
