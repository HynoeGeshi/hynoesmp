/*! Copyright © 2026 Hynoe. All rights reserved. */
const STOP=new Set(['the','a','an','and','or','to','of','in','on','for','with','is','are','be','your','you','this','that','it','as','at','by','from','what','how','do','i','me','my']);
const plain=value=>String(value??'').replace(/<[^>]*>/g,' ').replace(/&[a-z#0-9]+;/gi,' ').replace(/\s+/g,' ').trim();
const normalize=value=>plain(value).toLowerCase().replace(/[^a-z0-9_/-]+/g,' ').replace(/\s+/g,' ').trim();
const tokenList=value=>normalize(value).split(' ').filter(x=>x.length>1&&!STOP.has(x));

export function retrieveHynoe(entries,question,context={}){
  const q=normalize(question),qt=[...new Set(tokenList(question))],page=context.page||'',section=context.sectionId||'',room=normalize(context.outpostRoom||'');
  return (Array.isArray(entries)?entries:[]).map(entry=>{
    const entryTokens=new Set(Array.isArray(entry.tokens)?entry.tokens:tokenList(`${entry.heading} ${entry.text}`));
    const heading=normalize(entry.heading),text=normalize(entry.text);let score=0,matches=0;
    for(const token of qt){if(entryTokens.has(token)){score+=3;matches++;}if(heading.split(' ').includes(token))score+=2;}
    if(heading&&q.includes(heading))score+=5;
    if(page&&entry.path===page)score+=4;
    if(section&&entry.sectionId===section)score+=6;
    if(room&&(heading.includes(room)||text.includes(room))){score+=8;matches++;}
    if(q&&text.includes(q))score+=8;
    const coverage=qt.length?matches/qt.length:0;score+=coverage*4;
    return {entry,score,coverage};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||b.coverage-a.coverage||a.entry.path.localeCompare(b.entry.path)||a.entry.id.localeCompare(b.entry.id));
}

export function answerFromHynoe(entries,question,context={}){
  const ranked=retrieveHynoe(entries,question,context),top=ranked[0];
  if(!top||top.score<6){return {status:'unknown',answer:"I couldn't verify that from Hynoe's official site content yet.",links:[],confidence:0};}
  const chosen=ranked.filter(x=>x.score>=Math.max(6,top.score*.58)).slice(0,2);
  const answer=plain(top.entry.text||top.entry.heading).slice(0,620);
  const links=chosen.map(({entry})=>({label:entry.heading||entry.title,href:entry.path+(entry.sectionId?'#'+encodeURIComponent(entry.sectionId):'')}));
  return {status:'official',answer,links,confidence:Math.min(1,top.score/22)};
}
