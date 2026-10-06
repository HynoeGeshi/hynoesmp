/*! Copyright © 2026 Hynoe. All rights reserved. */
const STOP=new Set(['the','and','for','with','that','this','your','you','are','from','into','how','what','where','when','who','why','can','use','has','have','will','not','but','all','our','out','its','get','here','more','than','then','they','them','their','about','do','does','did','these','those','there','some']);
const words=value=>String(value||'').toLowerCase().normalize('NFKC').replace(/<[^>]*>/g,' ').replace(/[^a-z0-9+/_-]+/g,' ').split(/\s+/).filter(token=>token.length>1&&!STOP.has(token));
const norm=value=>words(value).join(' ');
export function retrieveHynoe(entries,question,context={}){
 const qTokens=[...new Set(words(question))];if(!qTokens.length)return [];
 const qPhrase=norm(question),page=String(context.page||'').replace(/^\//,''),section=String(context.sectionId||context.section||''),room=String(context.outpostRoom||'').toLowerCase();
 const ranked=[];
 for(const entry of entries||[]){
  const tokens=new Set(entry.tokens||words(`${entry.heading} ${entry.text}`)),headingTokens=new Set(words(entry.heading)),textNorm=norm(entry.text),headingNorm=norm(entry.heading);let score=0,hits=0;
  for(const token of qTokens){if(tokens.has(token)){score+=3;hits++;}if(headingTokens.has(token))score+=4;}
  if(qPhrase.length>3&&headingNorm.includes(qPhrase))score+=10;
  if(qPhrase.length>5&&textNorm.includes(qPhrase))score+=6;
  if(page&&entry.path===page)score+=hits?6:1;
  if(section&&entry.sectionId===section)score+=hits?10:2;
  if(room&&(entry.sectionId?.toLowerCase()===room||headingNorm.includes(room)||tokens.has(room)))score+=hits?7:2;
  if(hits)ranked.push({entry,score,hits});
 }
 return ranked.sort((a,b)=>b.score-a.score||b.hits-a.hits||a.entry.path.localeCompare(b.entry.path)||a.entry.id.localeCompare(b.entry.id));
}
function concise(text){const clean=String(text||'').replace(/\s+/g,' ').trim();if(clean.length<=520)return clean;const cut=clean.slice(0,520),last=Math.max(cut.lastIndexOf('. '),cut.lastIndexOf('! '),cut.lastIndexOf('? '));return (last>180?cut.slice(0,last+1):cut.slice(0,510)+'…');}
export function answerFromHynoe(entries,question,context={}){
 const ranked=retrieveHynoe(entries,question,context),top=ranked[0];
 if(!top||top.score<5||top.hits<1)return {status:'unknown',answer:'I couldn’t verify that from Hynoe’s official site information. I won’t guess about a Hynoe-specific rule or feature.',links:[],confidence:0};
 const supports=ranked.filter(item=>item.score>=Math.max(5,top.score*.55)).slice(0,2),answer=concise(top.entry.text),seen=new Set(),links=[];
 for(const {entry} of supports){const href=entry.path+(entry.sectionId?'#'+encodeURIComponent(entry.sectionId):'');if(seen.has(href))continue;seen.add(href);links.push({label:entry.heading||entry.title,href});}
 return {status:'official',answer,links,confidence:Math.min(1,top.score/24)};
}
