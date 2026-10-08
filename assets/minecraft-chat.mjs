export const MINECRAFT_CHAT_URL = 'https://hynoe-control-bridge.onrender.com/api/community/minecraft';

export async function loadMinecraftMessages(fetcher=fetch) {
  const response=await fetcher(MINECRAFT_CHAT_URL,{cache:'no-store',signal:AbortSignal.timeout(60000)});
  const result=await response.json();
  if(!response.ok || !result.enabled) throw Error(result.error||'Minecraft Chat is offline.');
  return result.messages||[];
}
export async function sendMinecraftMessage(client,body,fetcher=fetch) {
  if(!client?.auth?.getSession) throw Error('Join the community in Global Chat before posting.');
  const {data,error}=await client.auth.getSession();
  if(error || !data?.session?.access_token) throw Error('Join the community in Global Chat before posting.');
  let response;
  try {
    response=await fetcher(MINECRAFT_CHAT_URL,{method:'POST',headers:{Authorization:'Bearer '+data.session.access_token,'Content-Type':'application/json'},body:JSON.stringify({body,request_id:crypto.randomUUID()}),signal:AbortSignal.timeout(30000)});
  } catch {throw Error('Delivery is uncertain. Check the chat before sending again.');}
  const result=await response.json();
  if(!response.ok) throw Error(result.error||'Message could not be sent.');
  return result;
}
