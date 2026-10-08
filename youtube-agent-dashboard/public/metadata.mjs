import {createClient} from '/vendor/supabase.mjs';
const {supabaseUrl,supabaseAnonKey}=window.__HYNOE_YOUTUBE_AGENT_CONFIG__||{};
const client=createClient(supabaseUrl,supabaseAnonKey);
const CHANNEL='31031ac7-034b-420f-b8ec-de9952669afa',REVISION='2026-10-07-v2';
const $=id=>document.getElementById(id);
let session=null,ownerId=null,items=[],states=[],busy=false,stop=false,generation=0;
const rows=new Map();
function notice(text){$('notice').textContent=text;}
function controls(){ $('apply').disabled=busy||!session||!items.length;$('check').disabled=busy||!session||!items.length;$('stop').classList.toggle('hidden',!busy); }
function reset(){generation++;stop=true;items=[];states=[];rows.clear();$('items').replaceChildren();$('progress').value=0;$('count').textContent='';}
async function call(operation,extra={}){
 const {data:{session:current},error:authError}=await client.auth.getSession();
 if(authError||!current||current.user.id!==ownerId)throw new Error('Session changed. Sign in again before continuing.');
 const {data,error}=await client.functions.invoke('youtube-metadata-batch',{body:{channel_id:CHANNEL,revision:REVISION,operation,...extra}});
 if(error){let message;try{message=(await error.context.json())?.error;}catch{}throw new Error(message||error.message||'Metadata request failed');}
 if(!data?.ok)throw new Error(data?.error||'Save was not confirmed. Check saved changes before retrying.');
 return data;
}
function text(tag,value){const el=document.createElement(tag);el.textContent=value;return el;}
function render(){
 $('items').replaceChildren();rows.clear();
 for(const [index,item]of items.entries()){
  const card=document.createElement('article');const line=text('div',`${index+1} / ${items.length} · Not yet checked`);line.className='item-status';
  const h=text('h2',item.title);const details=document.createElement('details');details.append(text('summary','Review full description'),text('pre',item.description));
  card.append(line,h,details);$('items').append(card);rows.set(item.item_id,{line,card});
 }
}
function progress(){const n=states.filter(s=>s.matches).length;$('progress').value=n;$('count').textContent=`${n} / ${items.length} verified`;
 for(const s of states){const row=rows.get(s.item_id);if(row)row.line.textContent=s.matches?'Verified on YouTube':s.eligible?'Ready to update':'Skipped: no longer an eligible public item';}}
async function inspect(){const data=await call('inspect');states=data.states;progress();return data;}
async function load(){
 const ticket=generation;busy=true;controls();notice('Loading the approved private batch…');
 try{const data=await call('preview');if(ticket!==generation)return;items=[...data.items.map(x=>({...x,item_id:x.video_id})),{...data.playlist,item_id:data.playlist.playlist_id}];render();notice('Approved copy loaded. Nothing has been sent to YouTube. Select Apply approved changes to start.');}
 catch(e){notice(e.message);}finally{busy=false;controls();}
}
$('apply').addEventListener('click',async()=>{
 if(busy||!session)return;busy=true;stop=false;controls();const ticket=generation;
 try{
  notice('Checking the current public videos before saving…');await inspect();
  for(const s of states){
   if(stop||ticket!==generation)break;if(s.matches||!s.eligible)continue;
   rows.get(s.item_id).line.textContent='Backing up, saving, and verifying…';
   notice(`Updating ${items.find(x=>x.item_id===s.item_id)?.title||s.item_id}`);
   const result=await call('apply',{item_id:s.item_id,confirm_revision:REVISION,expected_title:s.current_title,expected_description:s.current_description});
   if(result.verified!==true)throw new Error('The save could not be verified. Check saved changes before retrying.');
   if(ticket!==generation)break;s.matches=true;progress();
  }
  if(ticket===generation){const matched=states.filter(s=>s.matches).length,skipped=states.filter(s=>!s.eligible).length;notice(stop?`Paused. ${matched} items verified. Check saved changes before continuing.`:matched===items.length?`All ${matched} items verified on YouTube. Original videos and visibility retained.`:`${matched} items verified; ${skipped} ineligible items were not changed.`);}
 }catch(e){notice(`Paused: ${e.message}`);}finally{busy=false;controls();}
});
$('check').addEventListener('click',async()=>{if(busy)return;busy=true;controls();try{await inspect();notice('Readback complete. This check made no YouTube changes.');}catch(e){notice(e.message);}finally{busy=false;controls();}});
$('stop').addEventListener('click',()=>{stop=true;notice('Pausing after the current request completes.');});
$('loginForm').addEventListener('submit',async event=>{event.preventDefault();$('loginButton').disabled=true;try{const {error}=await client.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});$('password').value='';if(error)throw error;}catch(e){notice(e.message);}finally{$('loginButton').disabled=false;}});
$('signOut').addEventListener('click',async()=>{stop=true;reset();const {error}=await client.auth.signOut();if(error)notice(error.message);});
async function applySession(next){const nextId=next?.user?.id||null;if(nextId===ownerId&&!!next===!!session){session=next;return;}reset();session=next;ownerId=nextId;$('loginPanel').classList.toggle('hidden',!!next);$('batchPanel').classList.toggle('hidden',!next);$('signOut').classList.toggle('hidden',!next);controls();if(next)await load();else notice('Sign in with your existing Hynoe Agent account to load the private batch.');}
client.auth.onAuthStateChange((_event,next)=>{setTimeout(()=>void applySession(next),0);});
const {data:{session:initial}}=await client.auth.getSession();await applySession(initial);
