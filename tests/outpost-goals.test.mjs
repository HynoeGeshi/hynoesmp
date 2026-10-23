import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../assets/watch-game.mjs';
import {goalOptions,goalView} from '../assets/outpost-goals.mjs';

test('goal choices cover next purchases, the current chapter and next Legacy',()=>{
  const s=G.fresh(1000);
  assert.deepEqual(goalOptions(s).map(x=>x.id),[
    'upgrade:pick:1','upgrade:crew:1','upgrade:drill:1','upgrade:forge:1',
    'research:precision:1','research:industry:1','research:survey:1',
    'gear:chisel:1','gear:engine:1','gear:lens:1','chapter:1','legacy:1'
  ]);
  for(const option of goalOptions(s))assert.ok(option.label.length>0);
  s.pick=250;s.crew=250;s.drill=250;s.forge=250;
  s.progress.research={precision:12,industry:12,survey:10};
  s.progress.gear={chisel:20,engine:20,lens:20};
  s.progress.chapter=12;s.prestige=10000;
  assert.deepEqual(goalOptions(s),[]);
});

test('workshop goal reports actual outstanding ore and remains the same completed target',()=>{
  const s=G.fresh(1000);s.pick=2;s.ore=40;
  const id='upgrade:pick:3',view=goalView(s,id);
  assert.equal(view.target,'upgrades');
  assert.deepEqual(view.requirements,[{label:'Ore',have:40,need:43,remaining:3}]);
  assert.equal(view.ready,false);assert.equal(view.completed,false);
  s.ore=43;assert.equal(goalView(s,id).ready,true);
  assert.equal(G.buy(s,'pick'),true);
  const done=goalView(s,id);
  assert.equal(done.id,id);assert.equal(done.completed,true);assert.equal(done.ready,false);
  assert.ok(done.requirements.every(x=>x.remaining===0));
  assert.ok(goalOptions(s).some(x=>x.id==='upgrade:pick:4'));
});

test('goals below an outstanding fixed level include all remaining purchase costs',()=>{
  const s=G.fresh(1000);s.pick=1;s.ore=78;
  assert.deepEqual(goalView(s,'upgrade:pick:3').requirements,[{label:'Ore',have:78,need:79,remaining:1}]);
  s.ore=79;assert.equal(goalView(s,'upgrade:pick:3').ready,true);
  assert.equal(G.buy(s,'pick'),true);assert.equal(s.ore,43);
  assert.equal(goalView(s,'upgrade:pick:3').requirements[0].need,43);
  assert.equal(G.buy(s,'pick'),true);assert.equal(goalView(s,'upgrade:pick:3').completed,true);
});

test('research and equipment requirements match purchases rather than granting resources',()=>{
  const s=G.fresh(1000);s.progress.research.precision=2;s.progress.insight=6;
  assert.deepEqual(goalView(s,'research:precision:3').requirements,[{label:'Insight',have:6,need:8,remaining:2}]);
  s.progress.insight=8;assert.equal(goalView(s,'research:precision:3').ready,true);
  assert.equal(G.research(s,'precision'),true);assert.equal(goalView(s,'research:precision:3').completed,true);
  s.progress.gear.lens=1;s.progress.bag.amethyst=2;s.progress.bag.coal=9;
  const lens=goalView(s,'gear:lens:2');
  assert.equal(lens.target,'research');
  assert.deepEqual(lens.requirements,[{label:'Amethyst',have:2,need:12,remaining:10},{label:'Coal',have:9,need:8,remaining:0}]);
  s.progress.bag.amethyst=12;assert.equal(goalView(s,'gear:lens:2').ready,true);
  assert.equal(G.craft(s,'lens'),true);assert.equal(goalView(s,'gear:lens:2').completed,true);
});

test('locked material routes explain real depth and chapter gates before becoming direct shortcuts',()=>{
  const s=G.fresh(1000);
  let sources=goalView(s,'gear:lens:1').sources;
  assert.ok(sources.some(x=>x.target==='mine'&&/50m/.test(x.label)));
  assert.ok(sources.some(x=>x.target==='frontier'&&/chapter 4/i.test(x.label)&&/Glass cathedral/.test(x.label)));
  assert.ok(!sources.some(x=>/^Mine Amethyst/.test(x.label)));
  assert.ok(!sources.some(x=>/^Collect Amethyst/.test(x.label)));
  s.depth=50;
  sources=goalView(s,'gear:lens:1').sources;
  assert.ok(sources.some(x=>x.target==='mine'&&/^Mine Amethyst/.test(x.label)));
  assert.ok(!sources.some(x=>/^Collect Amethyst/.test(x.label)));
  s.progress.chapter=4;
  sources=goalView(s,'gear:lens:1').sources;
  assert.ok(sources.some(x=>x.target==='frontier'&&/^Collect Amethyst/.test(x.label)));
  assert.ok(sources.some(x=>x.target==='research'&&/10 Insight/.test(x.label)));
});

test('material shortcuts do not confuse a material vein gate with the operation supply route',()=>{
  const s=G.fresh(1000);s.depth=50;
  let sources=goalView(s,'gear:lens:1').sources;
  assert.ok(!sources.some(x=>x.target==='operations'&&/Amethyst/.test(x.label)));
  s.depth=100;
  sources=goalView(s,'gear:lens:1').sources;
  assert.ok(sources.some(x=>x.target==='operations'&&/Amethyst/.test(x.label)));
});

test('chapter goals use the real mixed counters and retain the completed chapter',()=>{
  const s=G.fresh(1000),id='chapter:1';s.blocks=20;
  let view=goalView(s,id);
  assert.deepEqual(view.requirements,[{label:'Veins opened',have:20,need:20,remaining:0},{label:'Miners owned this Legacy',have:0,need:1,remaining:1}]);
  assert.equal(view.ready,false);assert.equal(view.target,'frontier');
  assert.ok(view.sources.some(x=>x.target==='upgrades'));
  s.crew=1;assert.equal(goalView(s,id).ready,true);
  assert.equal(G.claimChapter(s),true);
  view=goalView(s,id);assert.equal(view.completed,true);assert.equal(view.ready,false);
  assert.match(view.title,/A foothold/);assert.ok(goalOptions(s).some(x=>x.id==='chapter:2'));
});

test('the fixed next Legacy uses run ore and stays completed after a reset',()=>{
  const s=G.fresh(1000);s.prestige=1;s.run=399999;s.ore=1e9;
  assert.deepEqual(goalView(s,'legacy:2').requirements,[{label:'Ore mined this Legacy',have:399999,need:400000,remaining:1}]);
  assert.equal(goalView(s,'legacy:2').ready,false);
  s.run=400000;assert.equal(goalView(s,'legacy:2').ready,true);
  assert.equal(G.prestige(s,1000),true);
  assert.equal(goalView(s,'legacy:2').completed,true);
  assert.equal(goalView(s,'legacy:2').ready,false);
  assert.ok(goalOptions(s).some(x=>x.id==='legacy:3'));
});

test('invalid and impossible pinned IDs return an empty view without coercion',()=>{
  const s=G.fresh(1000);
  for(const id of [null,undefined,{},1,'','upgrade:unknown:1','upgrade:pick:0','upgrade:pick:251','upgrade:pick:1.5','upgrade:pick:01','upgrade:pick:Infinity','research:precision:13','gear:lens:21','chapter:0','chapter:13','chapter:2','legacy:0','legacy:10001','legacy:2','upgrade:pick:1:extra','__proto__'])assert.equal(goalView(s,id),null,String(id));
  assert.deepEqual(goalOptions(null),[]);assert.equal(goalView(null,'chapter:1'),null);
});

test('reading every goal neither mutates frozen game state nor exposes unsupported navigation',()=>{
  const s=G.fresh(1000);s.progress.chapter=8;s.depth=151;s.blocks=80;
  const before=structuredClone(s);
  const freeze=value=>{if(value&&typeof value==='object'){Object.freeze(value);for(const child of Object.values(value))freeze(child);}};
  freeze(s);
  const tabs=new Set(['mine','upgrades','research','frontier','journal','crew','operations','expeditions']);
  for(const option of goalOptions(s)){
    const view=goalView(s,option.id);
    assert.ok(view);assert.ok(tabs.has(view.target));
    for(const source of view.sources)assert.ok(tabs.has(source.target));
    for(const row of view.requirements){assert.ok(Number.isFinite(row.have)&&Number.isFinite(row.need));assert.equal(row.remaining,Math.max(0,row.need-row.have));}
  }
  assert.deepEqual(s,before);
});
