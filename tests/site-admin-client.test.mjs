import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adminSignIn,
  loadAdminDashboard,
  runModerationAction,
} from '../assets/site-social-admin.mjs';

test('admin sign in delegates only email/password to Supabase Auth', async () => {
  let received;
  const client={auth:{async signInWithPassword(value){received=value; return {data:{session:{user:{id:'admin'}}},error:null};}}};
  const session=await adminSignIn(client,'owner@example.com','secret');
  assert.equal(session.user.id,'admin');
  assert.deepEqual(received,{email:'owner@example.com',password:'secret'});
});

test('admin dashboard and moderation actions go through protected Edge Function', async () => {
  const calls=[];
  const client={functions:{async invoke(name,opts){calls.push([name,opts]); return {data:{ok:true},error:null};}}};
  await loadAdminDashboard(client);
  await runModerationAction(client,{action:'set_chat_pause',posting_paused:true,pause_message:'Maintenance'});
  assert.deepEqual(calls,[
    ['moderate-site-chat',{body:{action:'dashboard'}}],
    ['moderate-site-chat',{body:{action:'set_chat_pause',posting_paused:true,pause_message:'Maintenance'}}],
  ]);
});
