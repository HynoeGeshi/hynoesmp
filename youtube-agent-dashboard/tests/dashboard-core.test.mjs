import test from 'node:test';
import assert from 'node:assert/strict';
import {
  candidateBucket, sortCandidates, loadCandidates, previewPath,
  signPreview, attachPreview, submitApproval,
} from '../lib/dashboard-core.mjs';

test('candidate buckets match review priority', () => {
  assert.equal(candidateBucket({ render_status: 'ready', approval_state: 'pending' }), 'review');
  assert.equal(candidateBucket({ render_status: 'rendering', approval_state: 'pending' }), 'processing');
  assert.equal(candidateBucket({ render_status: 'ready', approval_state: 'approved' }), 'approved');
  assert.equal(candidateBucket({ render_status: 'failed', approval_state: 'pending' }), 'terminal');
});

test('sortCandidates prioritizes review clips', () => {
  const rows = [
    { id:'terminal', render_status:'failed', approval_state:'pending', score:99 },
    { id:'processing', render_status:'pending', approval_state:'pending', score:99 },
    { id:'approved', render_status:'ready', approval_state:'approved', score:99 },
    { id:'review', render_status:'ready', approval_state:'pending', score:90 },
  ];
  assert.deepEqual(sortCandidates(rows).map((x) => x.id), ['review','processing','approved','terminal']);
});

test('loadCandidates reads clip_candidates and sorts', async () => {
  const calls=[];
  const supabase={from(name){calls.push(name);return{select(){return Promise.resolve({data:[
    {id:'b',render_status:'pending',approval_state:'pending',score:99},
    {id:'a',render_status:'ready',approval_state:'pending',score:90},
  ],error:null});}}}};
  const rows=await loadCandidates(supabase);
  assert.equal(calls[0],'clip_candidates');
  assert.deepEqual(rows.map((x)=>x.id),['a','b']);
});

test('previewPath chooses only ready clip paths', () => {
  assert.equal(previewPath({render_status:'ready',preview_uri:'preview.mp4',render_uri:'render.mp4'}),'preview.mp4');
  assert.equal(previewPath({render_status:'ready',preview_uri:null,render_uri:'render.mp4'}),'render.mp4');
  assert.equal(previewPath({render_status:'pending',preview_uri:'preview.mp4'}),null);
});

test('signPreview uses private bucket and 600 second URL', async () => {
  const calls=[];
  const supabase={storage:{from(bucket){calls.push(['from',bucket]);return{
    async createSignedUrl(path,ttl){calls.push(['sign',path,ttl]);return{data:{signedUrl:'https://signed.example/clip'},error:null};}
  };}}};
  const url=await signPreview(supabase,{render_status:'ready',preview_uri:'channel/clip.mp4'});
  assert.equal(url,'https://signed.example/clip');
  assert.deepEqual(calls,[['from','clip-previews'],['sign','channel/clip.mp4',600]]);
});

test('ready clip without path errors before storage call', async () => {
  let called=false;
  const supabase={storage:{from(){called=true;throw new Error('unexpected');}}};
  await assert.rejects(()=>signPreview(supabase,{render_status:'ready'}),(error)=>error?.code==='preview_path_missing');
  assert.equal(called,false);
});

test('attachPreview re-signs exactly once after media error', async () => {
  let signed=0;
  const supabase={storage:{from(){return{async createSignedUrl(){signed+=1;return{data:{signedUrl:`https://signed.example/${signed}`},error:null};}};}}};
  const handlers={};
  const video={src:'',addEventListener(type,handler){handlers[type]=handler;},load(){}};
  await attachPreview(video,supabase,{render_status:'ready',preview_uri:'clip.mp4'});
  assert.equal(video.src,'https://signed.example/1');
  await handlers.error();
  assert.equal(video.src,'https://signed.example/2');
  await handlers.error();
  assert.equal(signed,2);
});

test('submitApproval uses approve_clip for allowed actions', async () => {
  const calls=[];
  const supabase={async rpc(name,args){calls.push([name,args]);return{data:[{approval_state:args.p_action==='approve'?'approved':'rejected'}],error:null};}};
  assert.equal((await submitApproval(supabase,'clip','approve','good')).approval_state,'approved');
  assert.equal(calls[0][0],'approve_clip');
  assert.deepEqual(calls[0][1],{p_clip_id:'clip',p_action:'approve',p_notes:'good'});
  await assert.rejects(()=>submitApproval(supabase,'clip','publish'),/invalid approval action/i);
  assert.equal(calls.length,1);
});


test('attachPreview surfaces a failed automatic re-sign to the UI', async () => {
  let signed=0;
  const supabase={storage:{from(){return{async createSignedUrl(){
    signed+=1;
    if(signed===1) return {data:{signedUrl:'https://signed.example/1'},error:null};
    return {data:null,error:new Error('signing unavailable')};
  }};}}};
  const handlers={};
  let surfaced=0;
  const video={
    src:'',
    addEventListener(type,handler){handlers[type]=handler;},
    dispatchEvent(event){if(event.type==='hynoe-preview-sign-failed') surfaced+=1; return true;},
    load(){}
  };
  await attachPreview(video,supabase,{render_status:'ready',preview_uri:'clip.mp4'});
  await handlers.error();
  assert.equal(signed,2);
  assert.equal(surfaced,1);
});
