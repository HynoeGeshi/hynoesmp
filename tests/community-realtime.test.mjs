import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as relay from '../relay/worker.mjs';

const record={id:'m-1',actorId:'private-actor',displayName:'CopperWolf-27',displayKind:'guest',text:'hello',createdAt:123,at:123,ipHash:'private'};

test('public realtime message event exposes only stable public fields',()=>{
 assert.equal(typeof relay.publicMessage,'function');
 assert.equal(typeof relay.messageEvent,'function');
 const message=relay.publicMessage(record);
 assert.deepEqual(message,{id:'m-1',displayName:'CopperWolf-27',displayKind:'guest',text:'hello',createdAt:123});
 assert.deepEqual(relay.messageEvent(record),{type:'message',message});
 assert.equal(JSON.stringify(relay.messageEvent(record)).includes('private-actor'),false);
 assert.equal(JSON.stringify(relay.messageEvent(record)).includes('private'),false);
});

test('delete and status events have bounded public shapes',()=>{
 assert.deepEqual(relay.deleteEvent('m-1'),{type:'delete',id:'m-1'});
 assert.deepEqual(relay.statusEvent(true),{type:'status',paused:true});
 assert.deepEqual(relay.statusEvent(false),{type:'status',paused:false});
});

test('message merge de-duplicates by stable id and stays chronological',()=>{
 assert.equal(typeof relay.mergePublicMessages,'function');
 const old=[{id:'b',createdAt:20,text:'old-b'},{id:'a',createdAt:10,text:'old-a'}];
 const incoming=[{id:'b',createdAt:20,text:'new-b'},{id:'c',createdAt:30,text:'new-c'}];
 const merged=relay.mergePublicMessages(old,incoming);
 assert.deepEqual(merged.map(x=>x.id),['a','b','c']);
 assert.equal(merged.find(x=>x.id==='b').text,'new-b');
});

test('ChatRoom broadcast removes failed sockets and sends identical serialized event',()=>{
 assert.equal(typeof relay.ChatRoom.prototype.broadcast,'function');
 const room=new relay.ChatRoom({storage:{}},{});
 const sent=[];
 const good={send:value=>sent.push(value)};
 const dead={send:()=>{throw new Error('closed');}};
 room.sockets=new Set([good,dead]);
 const event={type:'status',paused:false};
 room.broadcast(event);
 assert.deepEqual(sent,[JSON.stringify(event)]);
 assert.equal(room.sockets.has(good),true);
 assert.equal(room.sockets.has(dead),false);
});
