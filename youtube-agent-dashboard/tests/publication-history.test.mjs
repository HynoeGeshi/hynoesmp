import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCandidates, reviewQueue} from '../lib/dashboard-core.mjs';

const CHANNEL = '31031ac7-034b-420f-b8ec-de9952669afa';
const NEW_IDS = ['kFTPLWoi86c','_ZKpf_BqFz0','5TFLR3uQ1uw','MgYHwsdLP4U','xMcGlb15pbc'];
const LEGACY_IDS = ['oNwQjlWj5S0','2WxaP1anLVM','B9J_MQHeEZw','YXy7fcWg5ts'];
const clip = (id, job = {}) => ({id,channel_id:CHANNEL,approval_state:'approved',render_status:'ready',render_uri:id+'.mp4',publishing_jobs:[{id:'job-'+id,channel_id:CHANNEL,clip_candidate_id:id,...job}]});
const catalogue = LEGACY_IDS.map(video_id => ({channel_id:CHANNEL,video_id,privacy:'public'}));
const completed = [
  ...NEW_IDS.map((youtube_video_id,i) => clip('new-'+i,{state:'published',youtube_video_id,published_at:'2026-10-08T20:19:00Z'})),
  ...LEGACY_IDS.map((youtube_video_id,i) => ({...clip('legacy-'+i,{state:'awaiting_review',youtube_video_id}),publication_catalog:catalogue})),
];

test('five published jobs and four exact public catalogue matches leave approval cards without deleting data', () => {
  const drafts = [{...clip('foot-doctor',{state:'pending',youtube_video_id:null}),score:96}, {id:'hallway',channel_id:CHANNEL,approval_state:'pending',render_status:'ready',preview_uri:'hallway.mp4'}];
  const rejected = Array.from({length:10},(_,i)=>({id:'rejected-'+i,approval_state:'rejected'}));
  const candidates = [...completed,...drafts,...rejected], original = structuredClone(candidates);
  const queue = reviewQueue(candidates);
  assert.deepEqual(queue.active.map(c=>c.id),['foot-doctor','hallway']);
  assert.equal(queue.posted.length,9); assert.equal(queue.rejected.length,10);
  assert.equal(queue.counts.posted,9); assert.equal(queue.counts.approved,1); assert.equal(queue.counts.ready,1);
  assert.deepEqual(candidates,original);
});

test('uploaded private Short is tracked separately while approved-only and source IDs remain active', () => {
  const privateClip = clip('private',{state:'uploaded_private',youtube_video_id:'Ab1Cd2Ef3Gh'});
  const sourceOnly = {id:'source-only',channel_id:CHANNEL,approval_state:'approved',render_status:'ready',youtube_video_id:LEGACY_IDS[0],video_sources:{youtube_video_id:LEGACY_IDS[0]},publication_catalog:catalogue};
  const approvedOnly = clip('approved-only',{state:'pending',youtube_video_id:null});
  const queue = reviewQueue([privateClip,sourceOnly,approvedOnly]);
  assert.deepEqual(queue.active.map(c=>c.id),['source-only','approved-only']);
  assert.equal(queue.posted.length,0); assert.equal(queue.uploaded.length,1); assert.equal(queue.counts.uploaded,1);
});

test('missing, malformed, foreign and incomplete publication references stay visible as unverified', () => {
  const candidates = [
    clip('no-id',{state:'published',youtube_video_id:null}),
    clip('bad-id',{state:'published',youtube_video_id:'bad',published_at:'2026-10-08T20:19:00Z'}),
    clip('no-time',{state:'published',youtube_video_id:NEW_IDS[0],published_at:null}),
    clip('foreign-clip',{state:'published',youtube_video_id:NEW_IDS[1],published_at:'2026-10-08T20:19:00Z',clip_candidate_id:'another'}),
    clip('foreign-channel',{state:'published',youtube_video_id:NEW_IDS[2],published_at:'2026-10-08T20:19:00Z',channel_id:'another'}),
    {...clip('wrong-catalogue',{state:'awaiting_review',youtube_video_id:LEGACY_IDS[0]}),publication_catalog:[{channel_id:'another',video_id:LEGACY_IDS[0],privacy:'public'}]},
    {...clip('private-catalogue',{state:'awaiting_review',youtube_video_id:LEGACY_IDS[1]}),publication_catalog:[{channel_id:CHANNEL,video_id:LEGACY_IDS[1],privacy:'private'}]},
  ];
  const queue = reviewQueue(candidates);
  assert.equal(queue.active.length,candidates.length); assert.equal(queue.posted.length,0); assert.equal(queue.uploaded.length,0);
});

test('load reads owner-visible nested jobs and public catalogue only for actual uploaded Short IDs', async () => {
  const calls=[];
  const candidates=completed.map(({publication_catalog,...c})=>c);
  const supabase={from(table){
    const query={select(fields){calls.push({table,fields});return query;},in(key,values){calls.push({table,key,values});return query;},then(resolve,reject){return Promise.resolve({data:table==='clip_candidates'?candidates:catalogue,error:null}).then(resolve,reject);}};
    return query;
  }};
  const loaded=await loadCandidates(supabase), queue=reviewQueue(loaded);
  assert.equal(queue.posted.length,9); assert.equal(queue.active.length,0);
  assert.match(calls[0].fields,/publishing_jobs\(id,channel_id,clip_candidate_id,state,youtube_video_id,published_at\)/);
  assert.deepEqual(calls.find(c=>c.key==='video_id').values.sort(),[...NEW_IDS,...LEGACY_IDS].sort());
  assert.equal(calls.find(c=>c.table==='revival_catalog').fields,'channel_id,video_id,privacy');
});

test('same-channel unrelated public catalogue ID is not publication evidence for this job', () => {
  const candidate={...clip('unmatched',{state:'awaiting_review',youtube_video_id:LEGACY_IDS[0]}),publication_catalog:[{channel_id:CHANNEL,video_id:LEGACY_IDS[1],privacy:'public'}]};
  const queue=reviewQueue([candidate]);
  assert.equal(queue.active.length,1); assert.equal(queue.posted.length,0); assert.equal(queue.counts.attention,1);
});

test('current private or unlisted catalogue state overrides an older published job record', () => {
  for (const privacy of ['private','unlisted']) {
    const candidate={...clip('changed-visibility',{state:'published',youtube_video_id:NEW_IDS[0],published_at:'2026-10-08T20:19:00Z'}),publication_catalog:[{channel_id:CHANNEL,video_id:NEW_IDS[0],privacy}]};
    const queue=reviewQueue([candidate]);
    assert.equal(queue.active.length,1); assert.equal(queue.posted.length,0); assert.equal(queue.counts.attention,1);
  }
});

test('catalogue read failure throws instead of substituting generic approved flags or partial history', async () => {
  const failure = new Error('Owner catalogue read unavailable');
  const candidates = completed.map(({publication_catalog,...candidate})=>({...candidate,approved:true,auto_publish:true}));
  const reads=[];
  const supabase={from(table){
    reads.push(table);
    const query={select(){return query;},in(){return query;},then(resolve,reject){return Promise.resolve(table==='clip_candidates'?{data:candidates,error:null}:{data:null,error:failure}).then(resolve,reject);}};
    return query;
  }};
  await assert.rejects(()=>loadCandidates(supabase),error=>error===failure);
  assert.deepEqual(reads,['clip_candidates','revival_catalog']);
});
