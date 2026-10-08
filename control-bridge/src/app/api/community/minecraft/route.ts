import { createHash } from 'node:crypto';
import { createCommunityHandler, publicMessages, type FeedMessage } from '../../../../community/chat';

export const dynamic='force-dynamic';
export const runtime='nodejs';
let cached:{at:number;messages:ReturnType<typeof publicMessages>}|null=null;
let pending:Promise<ReturnType<typeof publicMessages>>|null=null;
async function discord(path:string,init:RequestInit={}) {
  const response=await fetch('https://discord.com/api/v10'+path,{...init,headers:{Authorization:'Bot '+process.env.MINECRAFT_DISCORD_BOT_TOKEN,'Content-Type':'application/json'},cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(!response.ok) throw Error('Discord unavailable');
  return response.json();
}
async function supabase(path:string,token:string,init:RequestInit={}) {
  const response=await fetch(process.env.SUPABASE_URL+path,{...init,headers:{apikey:process.env.SUPABASE_PUBLISHABLE_KEY||'',Authorization:'Bearer '+token,'Content-Type':'application/json'},cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(!response.ok) throw Error('Site authorization unavailable');
  return response.json();
}
async function handler(req:Request) {
  const channel=process.env.MINECRAFT_DISCORD_CHANNEL_ID||'';
  const configured=process.env.MINECRAFT_CHAT_ENABLED==='true' && Boolean(channel && process.env.MINECRAFT_DISCORD_BOT_TOKEN && process.env.BLOOM_API_KEY && process.env.BLOOM_SERVER_ID && process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);
  const missingConfiguration=['MINECRAFT_DISCORD_CHANNEL_ID','MINECRAFT_DISCORD_BOT_TOKEN','BLOOM_API_KEY','BLOOM_SERVER_ID','SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY'].filter(key=>!process.env[key]);
  return createCommunityHandler({
    enabled:configured,
    missingConfiguration,
    readFeed:async()=>{
      if(cached && Date.now()-cached.at<4000) return cached.messages;
      if(!pending) pending=(async()=>{
        const [feed,bot]=await Promise.all([discord(`/channels/${channel}/messages?limit=50`),discord('/users/@me')]);
        const messages=publicMessages(feed as FeedMessage[],bot.id);
        cached={at:Date.now(),messages};return messages;
      })().finally(()=>{pending=null;});
      return pending;
    },
    verifyUser:async(token)=>{const user=await supabase('/auth/v1/user',token);return user.id;},
    reserveSlot:async(token,requestId)=>{
      const name=await supabase('/rest/v1/rpc/claim_minecraft_chat_post',token,{method:'POST',body:JSON.stringify({p_request_id:requestId})});
      if(typeof name!=='string') throw Error(); return name;
    },
    postDiscord:async(content,requestId,userId)=>{
      const nonce=createHash('sha256').update(userId+':'+requestId).digest('hex').slice(0,24);
      const result=await discord(`/channels/${channel}/messages`,{method:'POST',body:JSON.stringify({content,allowed_mentions:{parse:[]},nonce,enforce_nonce:true})});
      cached=null;return result;
    },
    sendMinecraft:async(command)=>{
      const response=await fetch(`https://mc.bloom.host/api/client/servers/${encodeURIComponent(process.env.BLOOM_SERVER_ID||'')}/command`,{method:'POST',headers:{Authorization:'Bearer '+process.env.BLOOM_API_KEY,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({command}),signal:AbortSignal.timeout(10000)});
      if(!response.ok) throw Error('Minecraft unavailable');
    },
  })(req);
}
export const GET=handler;
export const POST=handler;
export const OPTIONS=handler;
