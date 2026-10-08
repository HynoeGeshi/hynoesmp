import { containsBlockedChatContent } from './content.mjs';

export type FeedMessage = {id:string; author:{id:string;username:string;global_name?:string;bot?:boolean};content:string;timestamp:string;webhook_id?:string};
type Dependencies = {
  enabled:boolean;
  missingConfiguration?:string[];
  readFeed:()=>Promise<unknown[]>;
  verifyUser:(token:string)=>Promise<string>;
  reserveSlot:(token:string,requestId:string)=>Promise<string>;
  postDiscord:(content:string,requestId:string,userId:string)=>Promise<{id:string}>;
  sendMinecraft:(command:string)=>Promise<void>;
};
const origins = new Set(['https://hynoesmp.com','https://www.hynoesmp.com','https://hynoesmp-social-preview.onrender.com']);
export function minecraftCommand(name:string,body:string) {
  return 'tellraw @a '+JSON.stringify([{text:'[WEB] ',color:'gold'},{text:name+': ',color:'yellow'},{text:body,color:'white'}]);
}
export function publicMessages(input:FeedMessage[],botId:string) {
  return input.filter(m=>m.content && !containsBlockedChatContent(m.content) && (!m.author.bot || m.webhook_id || m.author.id===botId)).map(m=>{
    const web=m.author.id===botId && /^\[WEB\] ([^\n:]{1,24}): ([\s\S]*)$/.exec(m.content);
    return {id:m.id,display_name:web?web[1]:(m.author.global_name||m.author.username),body:(web?web[2]:m.content).slice(0,2000),created_at:m.timestamp,source:web?'Website':m.webhook_id?'Minecraft':m.author.bot?'Server':'Discord'};
  }).reverse();
}
export function createCommunityHandler(deps:Dependencies) {
  return async (req:Request):Promise<Response>=>{
    const origin=req.headers.get('origin')||'';
    const headers:Record<string,string>={'Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'authorization, content-type'};
    if(origins.has(origin)) headers['Access-Control-Allow-Origin']=origin;
    const json=(data:unknown,status=200)=>Response.json(data,{status,headers});
    if(origin && !origins.has(origin)) return json({error:'Request origin is not allowed.'},403);
    if(req.method==='OPTIONS') return new Response(null,{status:204,headers});
    if(!deps.enabled) return json({error:'Minecraft Chat is temporarily offline.',missingConfiguration:deps.missingConfiguration||[]},503);
    if(req.method==='GET') {
      try {return json({enabled:true,messages:await deps.readFeed()});}
      catch {return json({error:'Minecraft Chat could not connect to Discord. Try again shortly.'},503);}
    }
    if(req.method!=='POST') return json({error:'Method not allowed.'},405);
    if(!origins.has(origin)) return json({error:'Request origin is required.'},403);
    const token=/^Bearer (\S+)$/i.exec(req.headers.get('authorization')||'')?.[1];
    if(!token) return json({error:'Join the community before sending a message.'},401);
    let payload;
    try {const text=await req.text();if(text.length>4096) throw Error();payload=JSON.parse(text);}
    catch {return json({error:'Invalid or oversized message.'},400);}
    const body=typeof payload?.body==='string'?payload.body.trim():'';
    const requestId=payload?.request_id;
    if(!body || body.length>300 || /[\x00-\x1f\x7f\u00a7\u200b-\u200f\u202a-\u202e\u2060-\u206f]/.test(body) || /^\//.test(body) || containsBlockedChatContent(body) || typeof requestId!=='string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) return json({error:'Use an allowed, single-line chat message of 1–300 characters. Commands are unavailable.'},400);
    let userId:string;
    try {userId=await deps.verifyUser(token);if(!userId) throw Error();}
    catch {return json({error:'Your site session expired. Join the community again.'},401);}
    let name:string;
    try {name=await deps.reserveSlot(token,requestId);if(!name) throw Error();}
    catch {return json({error:'Posting is unavailable, this request was already used, or the 15-second cooldown is active.'},429);}
    if(name.length>24 || !/^[A-Za-z0-9_ -]+$/.test(name) || /^(hynoe|admin|administrator|mod|moderator|staff|owner|system)$/i.test(name.trim()) || containsBlockedChatContent(name)) return json({error:'Your display name cannot be used in Minecraft Chat. Correct it in Global Chat first.'},400);
    let message;
    try {message=await deps.postDiscord(`[WEB] ${name}: ${body}`,requestId,userId);}
    catch {return json({error:'Discord delivery is uncertain. Check the chat before sending again.'},502);}
    try {await deps.sendMinecraft(minecraftCommand(name,body));}
    catch {return json({id:message.id,discord:true,minecraft:false,error:'Posted to Discord. Minecraft delivery could not be confirmed. Do not resend.'},207);}
    return json({id:message.id,discord:true,minecraft:true,status:'accepted_by_console'},201);
  };
}
