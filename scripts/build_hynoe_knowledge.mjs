import {readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

export const KNOWLEDGE_PAGES=['index.html','start.html','mca.html','progression.html','economy.html','bosses.html','join.html','modpack.html','updates.html','modded-minecraft-server.html','community-rules.html'];
const STOP=new Set(['the','and','for','with','that','this','your','you','are','from','into','how','what','where','when','who','why','can','use','has','have','will','not','but','all','our','out','its','get','here','more','than','then','they','them','their','about','hynoe','smp']);
const decode=s=>String(s).replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&nbsp;/g,' ').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));
const cleanText=html=>decode(String(html).replace(/<br\s*\/?>/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
export function tokenize(text){return [...new Set(cleanText(text).toLowerCase().normalize('NFKC').replace(/[^a-z0-9+/_-]+/g,' ').split(/\s+/).filter(t=>t.length>1&&!STOP.has(t)))].sort();}
function sanitize(html){return String(html).replace(/<!--[\s\S]*?-->/g,' ').replace(/<head\b[\s\S]*?<\/head>/gi,' ').replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<template\b[\s\S]*?<\/template>/gi,' ').replace(/<([a-z0-9-]+)\b[^>]*\shidden(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?[^>]*>[\s\S]*?<\/\1>/gi,' ');}
function titleOf(source,path){const match=source.match(/<title[^>]*>([\s\S]*?)<\/title>/i);return cleanText(match?.[1]||path.replace(/\.html$/,''));}
function nearestId(source,index){const prefix=source.slice(Math.max(0,index-1800),index),matches=[...prefix.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)];return matches.length?matches.at(-1)[1]:'';}
export async function buildKnowledge(rootDir){
 const entries=[];
 for(const path of KNOWLEDGE_PAGES){
  const raw=await readFile(join(rootDir,path),'utf8'),title=titleOf(raw,path),source=sanitize(raw),body=source.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1]||source;
  const pageText=cleanText(body).slice(0,1800);if(pageText)entries.push({id:`${path}:page`,path,title,sectionId:'',heading:title,text:pageText,tokens:tokenize(`${title} ${pageText}`)});
  const headings=[...body.matchAll(/<h([1-3])\b([^>]*)>([\s\S]*?)<\/h\1>/gi)];
  for(let i=0;i<headings.length;i++){
   const match=headings[i],heading=cleanText(match[3]);if(!heading)continue;
   const attrs=match[2]||'',ownId=attrs.match(/\bid\s*=\s*["']([^"']+)["']/i)?.[1]||'',sectionId=ownId||nearestId(body,match.index);
   const start=(match.index||0)+match[0].length,end=i+1<headings.length?headings[i+1].index:Math.min(body.length,start+3500),text=cleanText(body.slice(start,end)).slice(0,1100);
   if(text.length<8)continue;
   entries.push({id:`${path}:${sectionId||'section-'+i}`,path,title,sectionId,heading,text,tokens:tokenize(`${heading} ${text}`)});
  }
 }
 return entries.sort((a,b)=>a.path.localeCompare(b.path)||a.id.localeCompare(b.id));
}

async function main(){const root=resolve(fileURLToPath(new URL('..',import.meta.url))),entries=await buildKnowledge(root),out=join(root,'data','hynoe-knowledge.json');await writeFile(out,JSON.stringify({version:1,generatedFrom:'repository',entries},null,2)+'\n');console.log(`Wrote ${entries.length} Ask Hynoe knowledge entries to ${out}`);}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(error=>{console.error(error);process.exitCode=1;});
