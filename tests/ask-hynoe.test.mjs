import test from 'node:test';
import assert from 'node:assert/strict';
import {retrieveHynoe,answerFromHynoe} from '../assets/ask-hynoe-core.mjs';

const entries=[
 {id:'economy.html:tokens',path:'economy.html',title:'Economy',sectionId:'tokens',heading:'Tokens',text:'Tokens are progression rewards used for special utility items. Hynoe Dollars are the normal player economy currency.',tokens:['tokens','progression','rewards','utility','items','dollars','economy','currency']},
 {id:'start.html:tokens',path:'start.html',title:'Start Here',sectionId:'tokens',heading:'First steps',text:'Start by installing the pack and joining the server.',tokens:['start','installing','pack','joining','server']},
 {id:'join.html:install',path:'join.html',title:'Join',sectionId:'install',heading:'Install the pack',text:'Download the official Hynoe modpack first, then launch the required Fabric profile before joining.',tokens:['download','official','modpack','pack','fabric','joining','install']},
 {id:'watch.html:crew',path:'watch.html',title:'Hynoe Outpost',sectionId:'crew',heading:'Crew Deck',text:'Crew cards are earned from caches. Equip up to three active crew cards for bonuses, while reserves can work at stations.',tokens:['crew','cards','caches','equip','active','bonuses','reserves','stations']},
 {id:'progression.html:age',path:'progression.html',title:'Progression',sectionId:'genesis-ages',heading:'Genesis Ages',text:'Genesis Ages gate stronger tools, armor, dimensions, and story progression.',tokens:['genesis','ages','tools','armor','dimensions','story','progression']},
];

test('retrieval prefers exact topic and current page context',()=>{
 const ranked=retrieveHynoe(entries,'what are tokens for?',{page:'economy.html',sectionId:'tokens'});
 assert.equal(ranked[0].entry.id,'economy.html:tokens');
 assert.ok(ranked[0].score>ranked.at(-1).score);
});

test('join/install questions return an official answer with exact deep link',()=>{
 const result=answerFromHynoe(entries,'what do I download to join?',{page:'join.html'});
 assert.equal(result.status,'official');
 assert.match(result.answer,/official Hynoe modpack/i);
 assert.deepEqual(result.links[0],{label:'Install the pack',href:'join.html#install'});
 assert.ok(result.confidence>0);
});

test('Outpost context boosts the matching room without receiving a save object',()=>{
 const result=answerFromHynoe(entries,'how do I get these cards?',{page:'watch.html',outpostRoom:'crew'});
 assert.equal(result.status,'official');
 assert.match(result.answer,/caches/i);
 assert.match(result.links[0].href,/watch\.html#crew/);
});

test('duplicate or vague topics resolve stably and current section wins',()=>{
 const first=retrieveHynoe(entries,'progression',{page:'progression.html',sectionId:'genesis-ages'});
 const second=retrieveHynoe(entries,'progression',{page:'progression.html',sectionId:'genesis-ages'});
 assert.deepEqual(first,second);
 assert.equal(first[0].entry.id,'progression.html:age');
});

test('unknown and hostile-looking input never fabricates or executes content',()=>{
 for(const q of ['quantum banana insurance','<script>alert(1)</script>']){
  const result=answerFromHynoe(entries,q,{page:'index.html'});
  assert.equal(result.status,'unknown');
  assert.match(result.answer,/cannot verify|couldn.t verify/i);
  assert.deepEqual(result.links,[]);
 }
});
