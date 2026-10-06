import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAskRequest,
  appendTurn,
  formatHelpSources,
  shouldShowUncertainState,
  loadAskHistory,
  saveAskHistory,
  clearAskHistory,
} from '../assets/ask-hynoe-core.mjs';

test('buildAskRequest trims question, caps history, and sanitizes current page', () => {
  const history=Array.from({length:9},(_,i)=>({role:i%2?'assistant':'user',content:`turn ${i}`}));
  const request=buildAskRequest('  How do I join?  ',history,'javascript:alert(1)');
  assert.equal(request.question,'How do I join?');
  assert.equal(request.history.length,6);
  assert.equal(request.history[0].content,'turn 3');
  assert.equal(request.page_path,'/');
});

test('appendTurn accepts only user/assistant turns and preserves the newest bounded history', () => {
  let history=[];
  for(let i=0;i<8;i++) history=appendTurn(history,{role:i%2?'assistant':'user',content:` message ${i} `},6);
  assert.equal(history.length,6);
  assert.equal(history[0].content,'message 2');
  assert.throws(()=>appendTurn(history,{role:'system',content:'bad'}),/role/i);
  assert.throws(()=>appendTurn(history,{role:'user',content:'x'.repeat(501)}),/500/i);
});

test('source formatting keeps only safe same-site paths and bounded labels', () => {
  const formatted=formatHelpSources([
    {label:' Join guide ',url:'/join.html'},
    {label:'Bad',url:'javascript:alert(1)'},
    {label:'Also bad',url:'https://evil.example'},
  ]);
  assert.deepEqual(formatted,[{label:'Join guide',url:'/join.html'}]);
});

test('uncertain state is shown below medium confidence', () => {
  assert.equal(shouldShowUncertainState(0.25),true);
  assert.equal(shouldShowUncertainState(0.49),true);
  assert.equal(shouldShowUncertainState(0.5),false);
  assert.equal(shouldShowUncertainState(0.9),false);
});

test('local history load/save/reset is bounded and survives malformed storage safely', () => {
  const map=new Map();
  const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
  saveAskHistory(storage,[{role:'user',content:'hello'},{role:'assistant',content:'hi'}]);
  assert.equal(loadAskHistory(storage).length,2);
  map.set('hynoeAskHistory','not-json');
  assert.deepEqual(loadAskHistory(storage),[]);
  saveAskHistory(storage,[{role:'user',content:'fresh'}]);
  clearAskHistory(storage);
  assert.deepEqual(loadAskHistory(storage),[]);
});
