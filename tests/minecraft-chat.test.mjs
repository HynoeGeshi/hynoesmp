import test from 'node:test';
import assert from 'node:assert/strict';
import { loadMinecraftMessages, sendMinecraftMessage } from '../assets/minecraft-chat.mjs';

test('Minecraft feed surfaces provider errors instead of a false live status',async()=>{
  await assert.rejects(loadMinecraftMessages(async()=>Response.json({error:'Offline'},{status:503})),/Offline/);
});
test('Minecraft sends use refreshed site auth and do not trust client-supplied names',async()=>{
  let calls=0;
  const client={auth:{getSession:async()=>({data:{session:{access_token:'verified-jwt'}}})}};
  const result=await sendMinecraftMessage(client,'hi',async(url,options)=>{
    calls++;assert.equal(options.headers.Authorization,'Bearer verified-jwt');
    const payload=JSON.parse(options.body);assert.equal(payload.body,'hi');assert.equal(payload.name,undefined);assert.match(payload.request_id,/^[0-9a-f-]{36}$/);
    return Response.json({discord:true,minecraft:false,error:'Posted to Discord. Do not resend.'},{status:207});
  });
  assert.equal(result.minecraft,false);assert.equal(calls,1);
});
test('signed-out visitors cannot post and uncertain delivery is never automatically retried',async()=>{
  let calls=0;const fetcher=async()=>{calls++;throw Error('network timeout');};
  await assert.rejects(sendMinecraftMessage(null,'hi',fetcher),/Join/);assert.equal(calls,0);
  await assert.rejects(sendMinecraftMessage({auth:{getSession:async()=>({data:{session:{access_token:'jwt'}}})}},'hi',fetcher),/uncertain/);assert.equal(calls,1);
});
