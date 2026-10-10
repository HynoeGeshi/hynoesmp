import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../lib/owner-change.mjs';
import {PUBLIC_CHANGE_DRAFTS, HOME_DRAFTS} from '../public/change-drafts.mjs';

const owner = '8652cae0-769e-4269-bbf9-51ac6f0d9e3a';
const requestId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const approvalId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const proposal = {action: 'public_video_metadata', resource_id: 'publicVideo', target: {title: 'Reviewed title', description: 'Reviewed description'}};
function packageFor(p = proposal, noOp = false) {
  const snippet = {title: noOp ? p.target.title : 'Original title', description: noOp ? p.target.description : 'Original description', categoryId: '20'};
  return {action: p.action, resource_id: p.resource_id, channel_id: api.CHANGE_CHANNEL, youtube_channel_id: 'UCjWR1CZVFkrVk3S-TRrOGGQ', before: {owned_channel_id: 'UCjWR1CZVFkrVk3S-TRrOGGQ', snippet, status: {privacyStatus: 'public'}}, after: {api: 'videos', part: 'snippet', body: {id: p.resource_id, snippet: {...snippet, ...p.target}}}, policy: {kind: 'existing_public_metadata'}};
}
function fixture({drift = false, noOp = false, uncertain = false, inspectFails = false, receipts = [], preparedPackage} = {}) {
  const calls = [];
  const tables = {
    youtube_owner_change_requests: receipts.map(x => x.request),
    youtube_owner_change_approvals: receipts.map(x => x.approval)
  };
  const client = {
    auth: {getSession: async () => ({data: {session: {user: {id: owner}}}})},
    rpc: async (name, args) => {calls.push({name, args}); return {data: name === 'is_original_youtube_change_owner' ? true : approvalId};},
    from(table) {
      let records = tables[table] || [];
      const q = {select() {return q;}, eq(k, v) {records = records.filter(x => x[k] === v); return q;}, in(k, vs) {records = records.filter(x => vs.includes(x[k])); return q;}, order() {return q;}, limit(n) {records = records.slice(0,n); return q;}, then(resolve, reject) {return Promise.resolve({data: records}).then(resolve, reject);}};
      return q;
    },
    functions: {invoke: async (name, {body}) => {
      calls.push({name, body});
      if (body.operation === 'prepare') {
        const package_ = preparedPackage ? structuredClone(preparedPackage) : packageFor({...proposal, action: body.action, resource_id: body.resource_id, target: body.target}, noOp);
        if (drift) package_.after.body.snippet.title = 'Unapproved drift';
        return {data: {id: requestId, package: package_, state: 'awaiting_review'}};
      }
      if (body.operation === 'apply' && uncertain) return {error: {message: 'Outcome uncertain'}};
      if (body.operation === 'inspect' && inspectFails) return {error: {message: 'Readback mismatch'}};
      return {data: {ok: true, verified: true, state: 'applied'}};
    }}
  };
  return {client, calls};
}
const options = extra => ({ownerId: owner, confirmation: api.COPY_LAYOUT_CONFIRMATION, ...extra});

test('frozen plan contains exactly 78 approved targets in safe Home order', () => {
  assert.equal(typeof api.approvedCopyLayoutPlan, 'function');
  const plan = api.approvedCopyLayoutPlan(PUBLIC_CHANGE_DRAFTS, HOME_DRAFTS);
  assert.equal(plan.length, 78);
  assert.equal(plan[0].action, 'channel_description');
  assert.deepEqual(plan.filter(x => x.action === 'channel_section').map(x => x.target.snippet.position), [0,1,4,3,5,6]);
  assert.equal(plan.filter(x => x.action === 'public_video_metadata').length,62);
  assert.equal(plan.filter(x => x.action === 'public_playlist_description').length,9);
  assert.ok(!plan.some(x => x.action === 'restore_week_upload_visibility'));
});

test('unchecked package consent cannot start a writer', async () => {
  const {client, calls} = fixture();
  await assert.rejects(() => api.runApprovedCopyLayout(client, [proposal], options({confirmation: ''})), /package consent/i);
  assert.equal(calls.length,0);
});

test('every writer follows exact RPC UUID recording and preserves static target binding', async () => {
  const {client, calls} = fixture();
  const result = await api.runApprovedCopyLayout(client,[proposal],options());
  const writes = calls.filter(x => x.body?.operation === 'apply');
  assert.equal(result.completed,1);
  assert.equal(writes.length,1);
  const recordIndex = calls.findIndex(x => x.name === 'approve_youtube_owner_change');
  const writeIndex = calls.findIndex(x => x.body?.operation === 'apply');
  assert.ok(recordIndex >= 0 && recordIndex < writeIndex);
  assert.equal(writes[0].body.approval_id,approvalId);
});

test('scope or prepared target drift stops before recording or applying', async () => {
  const {client,calls} = fixture({drift:true});
  await assert.rejects(() => api.runApprovedCopyLayout(client,[proposal],options()), /approved target/i);
  assert.ok(!calls.some(x => x.name === 'approve_youtube_owner_change' || x.body?.operation === 'apply'));
  await assert.rejects(() => api.runApprovedCopyLayout(client,[{...proposal,action:'restore_week_upload_visibility'}],options()), /approved scope/i);
});

test('uncertain write is inspected once and never reapplied', async () => {
  const {client,calls} = fixture({uncertain:true});
  const result = await api.runApprovedCopyLayout(client,[proposal],options());
  assert.equal(result.completed,1);
  assert.equal(calls.filter(x => x.body?.operation === 'apply').length,1);
  assert.equal(calls.filter(x => x.body?.operation === 'inspect').length,1);
});

test('unresolved inspection stops the package without a second public write', async () => {
  const {client,calls} = fixture({uncertain:true,inspectFails:true});
  await assert.rejects(() => api.runApprovedCopyLayout(client,[proposal,proposal],options()), /inspection/i);
  assert.equal(calls.filter(x => x.body?.operation === 'apply').length,1);
  assert.equal(calls.filter(x => x.body?.operation === 'inspect').length,1);
});

test('matching live metadata is a no-op with no approval or public write', async () => {
  const {client,calls} = fixture({noOp:true});
  const result = await api.runApprovedCopyLayout(client,[proposal],options());
  assert.equal(result.unchanged,1);
  assert.ok(!calls.some(x => x.name === 'approve_youtube_owner_change' || x.body?.operation === 'apply'));
});

test('consumed matching owner receipt resumes by inspection without preparing or rewriting', async () => {
  const package_ = packageFor();
  const {client,calls} = fixture({receipts:[{
    request:{id:requestId,channel_id:api.CHANGE_CHANNEL,action:proposal.action,resource_id:proposal.resource_id,package:package_,state:'applied',result_resource_id:proposal.resource_id},
    approval:{id:approvalId,request_id:requestId,channel_id:api.CHANGE_CHANNEL,approved_by:owner,package:package_,approved_at:'2026-10-08T00:00:00Z',consumed_at:'2026-10-08T00:00:00Z',revoked_at:null}
  }]});
  const result = await api.runApprovedCopyLayout(client,[proposal],options());
  assert.equal(result.resumed,1);
  assert.deepEqual(calls.filter(x=>x.body).map(x=>x.body.operation),['inspect']);
});

test('pause stops before the next item and does not execute on load', async () => {
  const {client,calls} = fixture();
  const result = await api.runApprovedCopyLayout(client,[proposal],options({shouldPause:()=>true}));
  assert.equal(result.paused,true);
  assert.equal(result.completed,0);
  assert.ok(!calls.some(x=>x.body));
});

function sectionPackage(proposal, wireType, beforeType = wireType, noOp = false) {
  const isNew = proposal.resource_id.startsWith('new:');
  const before = isNew ? {owned_channel_id: 'UCjWR1CZVFkrVk3S-TRrOGGQ', exists: false} : {
    owned_channel_id: 'UCjWR1CZVFkrVk3S-TRrOGGQ',
    snippet: {...proposal.target.snippet, type: beforeType, position: noOp ? proposal.target.snippet.position : 0},
    contentDetails: structuredClone(proposal.target.contentDetails)
  };
  return {action: 'channel_section', resource_id: proposal.resource_id, channel_id: api.CHANGE_CHANNEL, youtube_channel_id: 'UCjWR1CZVFkrVk3S-TRrOGGQ', before,
    after: {api: 'channelSections', part: 'snippet,contentDetails', body: {...(isNew ? {} : {id: proposal.resource_id}), snippet: {...proposal.target.snippet, type: wireType}, contentDetails: structuredClone(proposal.target.contentDetails)}}, policy: {kind: 'channel_presentation'}};
}

test('canonical and legacy Home type enums match only their exact logical approved type', () => {
  for (const [legacy, wire] of [['singleplaylist','singlePlaylist'],['multipleplaylists','multiplePlaylists'],['completedevents','completedEvents']]) {
    const proposal = legacy === 'completedevents' ? HOME_DRAFTS.find(x=>x.key==='home:past-streams') : HOME_DRAFTS.find(x=>x.target.snippet.type===legacy);
    assert.equal(api.assertApprovedTarget({id:requestId,package:sectionPackage(proposal,wire,legacy)},proposal),true);
    const canonicalProposal = {...proposal,target:{...proposal.target,snippet:{...proposal.target.snippet,type:wire}}};
    assert.equal(api.assertApprovedTarget({id:requestId,package:sectionPackage(canonicalProposal,legacy,wire)},canonicalProposal),true);
    for(const wrong of ['foryou','SinglePlaylist',legacy==='singleplaylist'?'multiplePlaylists':'singlePlaylist']) {
      assert.throws(()=>api.assertApprovedTarget({id:requestId,package:sectionPackage(proposal,wrong)},proposal),/approved target/);
    }
    const drift=sectionPackage(proposal,wire,legacy);
    drift.after.body.snippet.position++;
    assert.throws(()=>api.assertApprovedTarget({id:requestId,package:drift},proposal),/approved target/);
  }
});

test('a canonical consumed Home receipt resumes a frozen legacy target by inspection only', async () => {
  const proposal = HOME_DRAFTS.find(x=>x.key==='home:survival');
  const package_ = sectionPackage(proposal,'singlePlaylist');
  const {client,calls} = fixture({receipts:[{
    request:{id:requestId,channel_id:api.CHANGE_CHANNEL,action:proposal.action,resource_id:proposal.resource_id,package:package_,state:'applied',result_resource_id:'UCjWR1CZVFkrVk3S-TRrOGGQ.created'},
    approval:{id:approvalId,request_id:requestId,channel_id:api.CHANGE_CHANNEL,approved_by:owner,package:package_,approved_at:'2026-10-08T00:00:00Z',consumed_at:'2026-10-08T00:00:00Z',revoked_at:null}
  }]});
  const result=await api.runApprovedCopyLayout(client,[proposal],options());
  assert.equal(result.resumed,1);
  assert.deepEqual(calls.filter(x=>x.body).map(x=>x.body.operation),['inspect']);
});

test('equivalent canonical and legacy existing Home snapshots skip public writes', async () => {
  const proposal=HOME_DRAFTS.find(x=>x.key==='home:full-series');
  const {client,calls}=fixture({preparedPackage:sectionPackage(proposal,'multiplePlaylists','multipleplaylists',true)});
  const result=await api.runApprovedCopyLayout(client,[proposal],options());
  assert.equal(result.unchanged,1);
  assert.ok(!calls.some(x=>x.name==='approve_youtube_owner_change'||x.body?.operation==='apply'));
});

test('a consumed existing resource with unknown response identity resumes by GET-only inspection', async () => {
  const package_=packageFor();
  const {client,calls}=fixture({receipts:[{
    request:{id:requestId,channel_id:api.CHANGE_CHANNEL,action:proposal.action,resource_id:proposal.resource_id,package:package_,state:'write_uncertain',result_resource_id:null},
    approval:{id:approvalId,request_id:requestId,channel_id:api.CHANGE_CHANNEL,approved_by:owner,package:package_,approved_at:'2026-10-08T00:00:00Z',consumed_at:'2026-10-08T00:00:00Z',revoked_at:null}
  }]});
  const result=await api.runApprovedCopyLayout(client,[proposal],options());
  assert.equal(result.resumed,1);
  assert.deepEqual(calls.filter(x=>x.body).map(x=>x.body.operation),['inspect']);
});

test('an uncertain created section without a known provider ID still stops before any request', async () => {
  const proposal=HOME_DRAFTS.find(x=>x.key==='home:survival');
  const package_=sectionPackage(proposal,'singlePlaylist');
  const {client,calls}=fixture({receipts:[{
    request:{id:requestId,channel_id:api.CHANGE_CHANNEL,action:proposal.action,resource_id:proposal.resource_id,package:package_,state:'write_uncertain',result_resource_id:null},
    approval:{id:approvalId,request_id:requestId,channel_id:api.CHANGE_CHANNEL,approved_by:owner,package:package_,approved_at:'2026-10-08T00:00:00Z',consumed_at:'2026-10-08T00:00:00Z',revoked_at:null}
  }]});
  await assert.rejects(()=>api.runApprovedCopyLayout(client,[proposal],options()),/owner inspection/);
  assert.deepEqual(calls.filter(x=>x.body),[]);
});
