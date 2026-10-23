import test from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../assets/outpost-preferences.mjs';

function store(value){const values=new Map([['hynoeOutpostV1','current-player-save'],['hynoeOutpostPlannerV1',value]]);return {values,getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};}
test('planner preferences survive reload without writing the game or legacy save',()=>{
  const storage=store(null),prefs={version:1,goal:'gear:chisel:1',presets:{mining:['coalhand'],caves:[],dispatch:null},completedGoal:null};
  assert.equal(P.writePreferences(storage,prefs),true);
  assert.deepEqual(P.readPreferences(storage),prefs);
  assert.equal(storage.values.get('hynoeOutpostV1'),'current-player-save');
  assert.equal(storage.values.has('hynoeDeepDeeperV1'),false);
});
test('invalid preferences fall back safely without deleting or replacing stored data',()=>{
  for(const raw of ['broken','null','{"version":99,"goal":"gear:chisel:1"}','{"version":1,"goal":"<script>bad</script>","presets":{"mining":["missing"]}}']){
    const storage=store(raw),prefs=P.readPreferences(storage);
    assert.equal(prefs.goal,null);assert.equal(prefs.presets.mining,null);
    assert.equal(storage.values.get('hynoeOutpostPlannerV1'),raw);
    assert.equal(storage.values.get('hynoeOutpostV1'),'current-player-save');
  }
});
test('blocked preference storage reports failure and does not throw into gameplay',()=>{
  const blocked={getItem(){throw Error('denied');},setItem(){throw Error('full');}};
  assert.equal(P.readPreferences(blocked).goal,null);
  assert.equal(P.writePreferences(blocked,{version:1}),false);
  assert.equal(P.writePreferences(null,{version:1}),false);
});
