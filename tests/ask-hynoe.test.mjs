import {test} from 'node:test';
import assert from 'node:assert/strict';
import {retrieveHynoe,answerFromHynoe} from '../assets/ask-hynoe-core.mjs';
const entries=[
{id:'econ-token',path:'economy.html',title:'Economy',sectionId:'tokens',heading:'Tokens',text:'Tokens are a separate progression reward currency used for special rewards and are not the same as Dollars.',tokens:['tokens','progression','reward','currency','dollars']},
{id:'join-pack',path:'join.html',title:'Join',sectionId:'install',heading:'Install the pack',text:'Install the Hynoe SMP modpack before connecting to the server.',tokens:['install','modpack','connect','server']},
{id:'start-pack',path:'start.html',title:'Start',sectionId:'install',heading:'Install',text:'Start here for your first day after the modpack is installed.',tokens:['start','first','day','modpack','install']},
{id:'outpost-crew',path:'watch.html',title:'Hynoe Outpost',sectionId:'crew',heading:'Crew Deck',text:'Open earned crew caches, collect cards, and equip your best three crew members to activate their bonuses.',tokens:['crew','cache','cards','equip','bonuses']}
];

test('current page and exact topic rank above duplicate headings',()=>{const ranked=retrieveHynoe(entries,'how do I install this?',{page:'join.html'});assert.equal(ranked[0].entry.id,'join-pack');});
test('economy token question returns official exact deep link',()=>{const a=answerFromHynoe(entries,'What are tokens for?',{page:'economy.html'});assert.equal(a.status,'official');assert.match(a.answer,/progression reward currency/i);assert.deepEqual(a.links[0].href,'economy.html#tokens');});
test('join question prefers official install guidance',()=>{const a=answerFromHynoe(entries,'what do i download or install to join?',{page:'join.html'});assert.equal(a.status,'official');assert.equal(a.links[0].href,'join.html#install');});
test('Outpost room context boosts matching game help without any save payload',()=>{const ranked=retrieveHynoe(entries,'what do i do here?',{page:'watch.html',outpostRoom:'Crew Deck'});assert.equal(ranked[0].entry.id,'outpost-crew');});
test('unknown question fails closed instead of inventing Hynoe rules',()=>{const a=answerFromHynoe(entries,'what is the airspeed velocity of a swallow?',{page:'index.html'});assert.equal(a.status,'unknown');assert.match(a.answer,/cannot verify|couldn't verify/i);});
test('HTML-like input remains plain retrieval text',()=>{const a=answerFromHynoe(entries,'<script>alert(1)</script> tokens',{page:'economy.html'});assert.equal(a.status,'official');assert.doesNotMatch(a.answer,/<script>/i);});
