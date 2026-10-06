import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

export const KNOWLEDGE_PAGES=['index.html','start.html','mca.html','progression.html','economy.html','bosses.html','join.html','modpack.html','updates.html','modded-minecraft-server.html','community-rules.html'];
const STOP=new Set(['the','a','an','and','or','to','of','in','on','for','with','is','are','be','your','you','this','that','it','as','at','by','from']);
const entityMap={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
const decode=s=>s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi,(_,e)=>{if(e[0]==='#'){const hex=e[1]?.toLowerCase()==='x';const n=parseInt(e.slice(hex?2:1),hex?16:10);return Number.isFinite(n)?String.fromCodePoint(n):' ';}return entityMap[e.toLowerCase()]??' ';});
const clean=s=>decode(s.replace(/<!--[^]*?-->/g,' ').replace(/<(script|style|svg|template)\b[^>]*>[^]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
const tokens=s=>[...new Set(clean(s).toLowerCase().replace(/[^a-z0-9_/-]+/g,' ').split(/\s+/).filter(x=>x.length>1&&!STOP.has(x)))].sort();
const attr=(attrs,name)=>{const m=attrs.match(new RegExp(`\\b${name}=["']([^"']+)["']`,'i'));return m?.[1]||'';};
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,64)||'section';
function nearestId(html,pos){const tail=html.slice(Math.max(0,pos-3500),pos),re=/<(?:section|article|div|main|header)\b([^>]*)>/gi;let m,last='';while((m=re.exec(tail)))last=attr(m[1],'id')||last;return last;}

export async function buildKnowledge(rootDir){
 const entries=[];
 for(const path of KNOWLEDGE_PAGES){
  const html=await readFile(resolve(rootDir,path),'utf8');
  const title=clean(html.match(/<title[^>]*>([^]*?)<\/title>/i)?.[1]||path);
  const mainMatch=html.match(/<main\b[^>]*>([^]*?)<\/main>/i);const body=mainMatch?.[1]||html.match(/<body\b[^>]*>([^]*?)<\/body>/i)?.[1]||'';
  const heads=[];const re=/<h([1-4])\b([^>]*)>([^]*?)<\/h\1>/gi;let m;
  while((m=re.exec(body)))heads.push({start:m.index,end:re.lastIndex,attrs:m[2],heading:clean(m[3])});
  if(!heads.length){const text=clean(body).slice(0,900);entries.push({id:`${slug(path)}-page`,path,title,sectionId:'',heading:title,text,tokens:tokens(title+' '+text)});continue;}
  heads.forEach((h,i)=>{
   const next=heads[i+1]?.start??body.length;let text=clean(body.slice(h.end,next));if(text.length>900)text=text.slice(0,897).trimEnd()+'…';
   if(!text)text=h.heading;const sectionId=attr(h.attrs,'id')||nearestId(body,h.start);const id=`${slug(path)}-${slug(sectionId||h.heading)}-${i+1}`;
   entries.push({id,path,title,sectionId,heading:h.heading||title,text,tokens:tokens((h.heading||'')+' '+text)});
  });
 }
 return entries.sort((a,b)=>a.path.localeCompare(b.path)||a.id.localeCompare(b.id));
}

const here=fileURLToPath(import.meta.url);
if(process.argv[1]&&resolve(process.argv[1])===resolve(here)){
 const root=resolve(dirname(here),'..'),out=resolve(root,'data/hynoe-knowledge.json');const entries=await buildKnowledge(root);await writeFile(out,JSON.stringify(entries,null,2)+'\n');console.log(`Wrote ${entries.length} Ask Hynoe knowledge entries to ${out}`);
}
