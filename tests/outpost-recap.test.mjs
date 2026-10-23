import test from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../assets/watch-game.mjs';
import * as R from '../assets/outpost-recap.mjs';

test('restore observer reports the exact already-credited ore and station deliveries once',()=>{
  const old=G.fresh(1000000);old.crew=1;old.progress.crewDeck.cards.coalhand={stars:1,shards:0};
  old.progress.command.stations.quarry.crew='coalhand';
  let report,calls=0;
  const restored=G.restore(JSON.stringify(old),1060000,event=>{calls++;report=R.buildRecap(event);});
  assert.equal(calls,1);
  assert.equal(report.awaySeconds,60);
  assert.equal(report.creditedSeconds,60);
  assert.equal(report.ore,48);
  assert.equal(report.insight,0);
  assert.equal(report.materials.coal,restored.progress.bag.coal);
  assert.equal(report.materials.copper,restored.progress.bag.copper);
  assert.equal(restored.ore,48);
  const before=JSON.stringify(restored);
  R.buildRecap({before:R.snapshot(restored),after:R.snapshot(restored),elapsed:60});
  assert.equal(JSON.stringify(restored),before,'recap must never grant anything');
});

test('offline recap describes the existing eight hour cap without increasing credit',()=>{
  const old=G.fresh(1000000);old.crew=1;let report;
  const restored=G.restore(old,1000000+10*3600000,event=>{report=R.buildRecap(event);});
  assert.ok(report,'restore should provide an earnings observation');
  assert.equal(report.awaySeconds,36000);
  assert.equal(report.creditedSeconds,28800);
  assert.equal(report.capped,true);
  assert.equal(report.ore,23040);
  assert.equal(restored.ore,23040);
});

test('clock rollback and malformed saves do not fabricate an absence or earnings',()=>{
  const old=G.fresh(1000000);old.crew=1;let report;
  G.restore(old,900000,event=>{report=R.buildRecap(event);});
  assert.ok(report,'restore should report a zero-length absence safely');
  assert.equal(report.awaySeconds,0);assert.equal(report.ore,0);
  let calls=0;G.restore('broken',900000,()=>calls++);assert.equal(calls,0);
});

test('observer errors cannot turn a restored progressed save into a partial fallback',()=>{
  const old=G.fresh(1000000);old.crew=1;old.pick=3;old.ore=200;old.total=500;old.blocks=17;
  const restored=G.restore(old,1060000,()=>{throw Error('optional display failed');});
  assert.equal(restored.ore,248);assert.equal(restored.pick,3);assert.equal(restored.blocks,17);
});

test('save status timestamps only a successful write and reports failure truthfully',()=>{
  assert.equal(typeof R.saveStatus,'function');
  assert.match(R.saveStatus({ok:false,lastSavedAt:1000}),/cannot|unavailable/i);
  assert.match(R.saveStatus({ok:null,lastSavedAt:null}),/waiting|not yet/i);
  assert.match(R.saveStatus({ok:true,lastSavedAt:1000}),/saved.*device/i);
});
