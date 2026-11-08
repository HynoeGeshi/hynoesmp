import { createHash } from 'node:crypto';
import { createCommunityHandler, publicMessages, type FeedMessage } from '../../../../community/chat';

export const dynamic='force-dynamic';
export const runtime='nodejs';
type Feed=ReturnType<typeof publicMessages>;
type DiscordSession={token:string;botId?:Promise<string>;feed?:{channel:string;cached?:{at:number;messages:Feed};pending?:Promise<Feed>}};
let discordSession:DiscordSession|undefined;
async function discord(token:string,path:string,init:RequestInit={}) {
  const response=await fetch('https://discord.com/api/v10'+path,{...init,headers:{Authorization:'Bot '+token,'Content-Type':'application/json'},cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(!response.ok) throw Error('Discord unavailable');
  return response.json();
}
function botId(session:DiscordSession) {
  return session.botId ??= discord(session.token,'/users/@me').then(bot=>{
    if(typeof bot?.id!=='string' || !bot.id) throw Error('Discord bot identity unavailable');
    return bot.id;
  }).catch(error=>{
    session.botId=undefined;
    throw error;
  });
}
async function supabase(path:string,token:string,init:RequestInit={}) {
  const response=await fetch(process.env.SUPABASE_URL+path,{...init,headers:{apikey:process.env.SUPABASE_PUBLISHABLE_KEY||'',Authorization:'Bearer '+token,'Content-Type':'application/json'},cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(!response.ok) throw Error('Site authorization unavailable');
  return response.json();
}
async function handler(req:Request) {
  const channel=process.env.MINECRAFT_DISCORD_CHANNEL_ID||'';
  const discordToken=process.env.MINECRAFT_DISCORD_BOT_TOKEN||'';
  if(discordSession?.token!==discordToken) discordSession={token:discordToken};
  const session=discordSession;
  if(session.feed?.channel!==channel) session.feed={channel};
  const state=session.feed;
  const configured=process.env.MINECRAFT_CHAT_ENABLED==='true' && Boolean(channel && discordToken && process.env.BLOOM_API_KEY && process.env.BLOOM_SERVER_ID && process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);
  const missingConfiguration=['MINECRAFT_DISCORD_CHANNEL_ID','MINECRAFT_DISCORD_BOT_TOKEN','BLOOM_API_KEY','BLOOM_SERVER_ID','SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY'].filter(key=>!process.env[key]);
  return createCommunityHandler({
    enabled:configured,
    missingConfiguration,
    readFeed:async()=>{
      if(state.cached && Date.now()-state.cached.at<4000) return state.cached.messages;
      if(!state.pending) state.pending=(async()=>{
        const [feed,id]=await Promise.all([discord(discordToken,`/channels/${channel}/messages?limit=50`),botId(session)]);
        const messages=publicMessages(feed as FeedMessage[],id);
        state.cached={at:Date.now(),messages};return messages;
      })().finally(()=>{state.pending=undefined;});
      return state.pending;
    },
    verifyUser:async(token)=>{const user=await supabase('/auth/v1/user',token);return user.id;},
    reserveSlot:async(token,requestId)=>{
      const name=await supabase('/rest/v1/rpc/claim_minecraft_chat_post',token,{method:'POST',body:JSON.stringify({p_request_id:requestId})});
      if(typeof name!=='string') throw Error(); return name;
    },
    postDiscord:async(content,requestId,userId)=>{
      const nonce=createHash('sha256').update(userId+':'+requestId).digest('hex').slice(0,24);
      const result=await discord(discordToken,`/channels/${channel}/messages`,{method:'POST',body:JSON.stringify({content,allowed_mentions:{parse:[]},nonce,enforce_nonce:true})});
      state.cached=undefined;return result;
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
