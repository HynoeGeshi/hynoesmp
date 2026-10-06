/*! Copyright © 2026 Hynoe. All rights reserved. */
import {answerFromHynoe} from './ask-hynoe-core.mjs';
const HISTORY_KEY='hynoeAskHynoeHistoryV1';
const el=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;};
const loadJSON=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch{return fallback;}};
const saveJSON=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};
const currentPage=()=>location.pathname.split('/').pop()||'index.html';
const getContext=()=>({page:currentPage(),sectionId:location.hash.slice(1)||undefined,outpostRoom:document.querySelector('.mine-tab[aria-selected="true"],.tabs [aria-selected="true"],.room-card.active,[data-go].active')?.textContent?.trim().slice(0,80)||undefined});
async function cfg(){try{const r=await fetch('data/chat-config.json',{cache:'no-store'});return r.ok?await r.json():{};}catch{return {};}}
async function externalFallback(config,question,context){
 if(!config.externalHelpEnabled||!config.communityUrl)return {status:'unavailable'};
 try{const r=await fetch(config.communityUrl.replace(/\/$/,'')+'/help/external',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,context}),signal:AbortSignal.timeout(12000)});if(!r.ok)return {status:'unavailable'};return await r.json();}catch{return {status:'unavailable'};}
}
function renderTurn(log,turn){
 const bubble=el('article','hc-ask-bubble '+(turn.role==='user'?'hc-ask-user':'hc-ask-bot'));
 if(turn.role==='assistant'&&turn.source){bubble.append(el('small','hc-source-label',turn.source));}
 bubble.append(el('div','',turn.text));
 if(turn.links?.length){for(const link of turn.links.slice(0,3)){const a=el('a','',link.label||'Open source');a.href=link.href;a.rel='noreferrer';bubble.append(a);}}
 log.append(bubble);
}

export async function mount(host){
 host.replaceChildren();const status=el('div','hc-status','Loading Hynoe knowledge…'),suggestions=el('div','hc-suggestions'),log=el('div','hc-ask-log');log.setAttribute('aria-live','polite');
 const form=el('form','hc-ask-form'),row=el('div'),input=document.createElement('textarea'),send=el('button','', 'Ask');send.type='submit';input.rows=2;input.maxLength=500;input.placeholder='Ask about Hynoe SMP, Hynoe Outpost, commands, progression…';input.setAttribute('aria-label','Ask Hynoe question');row.append(input,send);const reset=el('button','', 'Clear private history');reset.type='button';reset.style.marginTop='8px';form.append(row,reset);host.append(status,suggestions,log,form);
 let entries=[];try{const r=await fetch('data/hynoe-knowledge.json',{cache:'no-store'});if(!r.ok)throw Error('Knowledge index unavailable.');entries=await r.json();status.textContent='Official Hynoe help · private to this browser';}catch(e){status.textContent='Ask Hynoe could not load official knowledge yet.';send.disabled=true;return;}
 const config=await cfg();let history=loadJSON(HISTORY_KEY,[]);if(!Array.isArray(history))history=[];history=history.slice(-20);
 const render=()=>{log.replaceChildren();if(!history.length)log.append(el('p','hc-empty','Ask me how Hynoe SMP or Hynoe Outpost works. I check Hynoe first.'));for(const turn of history)renderTurn(log,turn);log.scrollTop=log.scrollHeight;};render();
 const prompts=['What are Tokens for?','How do I join?','How does Crew Deck work?','What should I do next?'];for(const text of prompts){const b=el('button','',text);b.type='button';b.onclick=()=>{input.value=text;input.focus();};suggestions.append(b);}
 let liveContext=getContext();window.addEventListener('hynoe:context',e=>{const d=e.detail||{};liveContext={...liveContext,...Object.fromEntries(Object.entries(d).filter(([k])=>['page','sectionId','outpostRoom'].includes(k)))};});
 async function answer(question){
   const context={...getContext(),...liveContext,page:currentPage()};const official=answerFromHynoe(entries,question,context);
   if(official.status==='official')return {role:'assistant',source:'OFFICIAL HYNOE',text:official.answer,links:official.links};
   const ext=await externalFallback(config,question,context);
   if(ext.status==='external'&&typeof ext.answer==='string')return {role:'assistant',source:'EXTERNAL MINECRAFT/MOD INFO',text:ext.answer,links:Array.isArray(ext.sources)?ext.sources.map(s=>({label:s.title||'External source',href:s.url})):[]};
   return {role:'assistant',source:'HYNOE CHECK',text:"I couldn't verify that from Hynoe's official content yet, and no trusted external answer is available right now.",links:[]};
 }
 form.onsubmit=async e=>{e.preventDefault();const question=input.value.trim();if(!question)return;send.disabled=true;history.push({role:'user',text:question});history=history.slice(-20);saveJSON(HISTORY_KEY,history);input.value='';render();status.textContent='Checking Hynoe first…';try{history.push(await answer(question));history=history.slice(-20);saveJSON(HISTORY_KEY,history);status.textContent='Official Hynoe content is always preferred.';}catch{history.push({role:'assistant',source:'HYNOE CHECK',text:"I couldn't verify that answer right now."});saveJSON(HISTORY_KEY,history);status.textContent='Answer unavailable.';}finally{render();send.disabled=false;input.focus();}};
 reset.onclick=()=>{history=[];saveJSON(HISTORY_KEY,history);render();status.textContent='Private Ask Hynoe history cleared from this browser.';};
}
