import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as S from '../assets/watch-session.mjs';
import * as G from '../assets/watch-game.mjs';

const state = () => ({ore:0,total:0,blocks:0,pick:0,crew:0,drill:0,forge:0,opsRuns:0,progress:{surveys:0,insight:0,command:{marks:0}}});
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('elapsed time and page visibility never award items or viewing streaks', () => {
  for (const visible of [true, false]) {
    const s=state(), p=S.fresh('2026-10-07',s), before=structuredClone(s);
    const events=[];
    for(let i=0;i<17280;i++) events.push(...S.tick(p,s,5,visible));
    assert.deepEqual(s,before);
    assert.deepEqual(events,[]);
    assert.equal(p.seconds,0);
    assert.equal(p.streak,0);
    assert.deepEqual(S.MILESTONES,[]);
  }
});

test('old sessions cannot cash in unclaimed timed rewards', () => {
  const s=state(); s.ore=900; s.total=900; s.progress.insight=8; s.progress.command.marks=4;
  const old={...S.fresh('2026-10-07',s),seconds:3599,claimed:[],streak:8,lastCompleted:'2026-10-06'};
  const before=structuredClone(s), p=S.restore(JSON.stringify(old),'2026-10-07',s);
  assert.deepEqual(S.tick(p,s,5,true),[]);
  assert.deepEqual(s,before);
  assert.equal(p.seconds,0);
  assert.equal(p.streak,0);
  assert.equal(S.view(p,s).next,null);
});

test('mining building and exploration still award the play bonus once without video or visibility', () => {
  const s=state(), p=S.fresh('2026-10-07',s);
  s.blocks=5; s.pick=1; s.opsRuns=1;
  const events=S.tick(p,s,0,false);
  assert.equal(p.missionClaimed,true);
  assert.equal(s.ore,75); assert.equal(s.total,75); assert.equal(s.progress.insight,1);
  assert.deepEqual(events.map(e=>e.type),['mission']);
  assert.doesNotMatch(events[0].text,/stream|watch/i);
  S.tick(p,s,3600,true);
  assert.equal(s.ore,75);
});

test('partial gameplay never earns the combined play bonus', () => {
  const s=state(), p=S.fresh('2026-10-07',s);
  s.blocks=5; s.pick=1;
  for(let i=0;i<800;i++) S.tick(p,s,5,true);
  assert.equal(s.ore,0); assert.equal(p.missionClaimed,false);
  assert.equal(S.view(p,s).missions.filter(m=>m.done).length,2);
});

test('same-day restore preserves earned balances and claimed gameplay bonus', () => {
  const s=state(), p=S.fresh('2026-10-07',s);
  s.blocks=5; s.pick=1; s.opsRuns=1; S.tick(p,s,0,false);
  const before=structuredClone(s), r=S.restore(JSON.stringify(p),'2026-10-07',s);
  S.tick(r,s,99999,true);
  assert.deepEqual(s,before); assert.equal(r.missionClaimed,true); assert.deepEqual(r.base,p.base);
});

test('next-day restore requires fresh gameplay and never carries a viewing streak', () => {
  const s=state(), p=S.fresh('2026-10-06',s);
  s.blocks=5; s.pick=1; s.opsRuns=1; S.tick(p,s,0,false);
  p.seconds=3600; p.claimed=[0,1,2,3]; p.streak=9; p.lastCompleted='2026-10-06';
  const r=S.restore(p,'2026-10-07',s), before=structuredClone(s);
  assert.equal(r.streak,0); assert.equal(r.seconds,0); assert.deepEqual(r.claimed,[]);
  assert.equal(r.missionClaimed,false); S.tick(r,s,3600,true); assert.deepEqual(s,before);
});

test('malformed sessions restore safely without creating any reward', () => {
  for(const raw of ['invalid',null,{version:99},{version:1,day:'2026-10-07',base:{blocks:-5,upgrades:Infinity,activity:NaN}}]) {
    const s=state(), before=structuredClone(s), p=S.restore(raw,'2026-10-07',s);
    S.tick(p,s,Infinity,true); assert.deepEqual(s,before); assert.equal(p.seconds,0);
  }
});

test('ordinary offline mining and earned cards are unaffected', () => {
  const s=G.fresh(1000); s.crew=1; s.progress.crewDeck.cards.coalhand={stars:2,shards:3};
  const r=G.restore(JSON.stringify(s),1000+48*3600000);
  assert.equal(r.ore,28800*.8);
  assert.deepEqual(r.progress.crewDeck.cards.coalhand,{stars:2,shards:3});
});

test('game page removes viewing incentive copy and retains gameplay goals', () => {
  const html=read('watch.html'), ui=read('assets/watch.mjs');
  for(const text of [html,ui]) assert.doesNotMatch(text,/Stream Run|stream-day streak|Timed drops|Next drop in|WATCH \+ PLAY LOOP|PLAY WHILE YOU WATCH|Stay 10 min/i);
  assert.match(html,/Daily Play Goals/);
  assert.match(html,/No video, like, subscription, or time spent watching is required/);
  assert.match(html,/id="watch-missions"/);
  assert.match(html,/id="watch-progress"[^>]*max="3"/);
  assert.doesNotMatch(html,/id="watch-(?:time|streak|next|milestones)"/);
  assert.match(ui,/S\.tick\(streamRun,state\)/);
  assert.doesNotMatch(ui,/S\.tick\(streamRun,state,elapsed/);
});

test('both changed browser entry points have an additional cache-busting revision', () => {
  assert.match(read('watch.html'),/assets\/watch\.mjs\?v=20261006d&amp;rewards=gameplay-only-20261007/);
  assert.match(read('assets/watch.mjs'),/watch-session\.mjs\?v=20261006d&rewards=gameplay-only-20261007/);
});
