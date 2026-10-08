/*! Copyright © 2026 Hynoe. All rights reserved. See /COPYRIGHT.md. */
// Compatibility export: timed/viewing rewards have been retired.
export const MILESTONES=Object.freeze([]);
export function todayKey(now=Date.now()){const d=new Date(now),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return d.getFullYear()+'-'+m+'-'+day;}
const clean=n=>Number.isFinite(n)&&n>=0?Math.floor(n):0;
const upgradeTotal=s=>['pick','crew','drill','forge'].reduce((sum,id)=>sum+clean(s?.[id]),0);
const activityTotal=s=>clean(s?.opsRuns)+clean(s?.progress?.surveys);
const snapshot=s=>({blocks:clean(s?.blocks),upgrades:upgradeTotal(s),activity:activityTotal(s)});
// Retain the existing save format/key and same-day claim state. Old viewing
// counters are inert; migration never deducts items from the main game save.
export function fresh(day,state){return {version:1,day,seconds:0,claimed:[],missionClaimed:false,base:snapshot(state),streak:0,lastCompleted:''};}
export function restore(raw,day,state){let p;try{p=typeof raw==='string'?JSON.parse(raw):raw;}catch{}if(!p||p.version!==1||p.day!==day)return fresh(day,state);const base=p.base&&typeof p.base==='object'?{blocks:clean(p.base.blocks),upgrades:clean(p.base.upgrades),activity:clean(p.base.activity)}:snapshot(state);return {...fresh(day,state),base,missionClaimed:!!p.missionClaimed};}
export function missions(session,state){return [
 {id:'mine',label:'Open 5 veins',progress:Math.max(0,clean(state?.blocks)-session.base.blocks),target:5},
 {id:'build',label:'Buy 1 upgrade',progress:Math.max(0,upgradeTotal(state)-session.base.upgrades),target:1},
 {id:'explore',label:'Finish 1 operation or cave',progress:Math.max(0,activityTotal(state)-session.base.activity),target:1}
].map(x=>({...x,done:x.progress>=x.target}));}
// Rewards depend only on completed game actions. Extra legacy arguments for
// elapsed time/visibility are ignored; no player state or engagement is read.
export function tick(session,state){const events=[];if(!session.missionClaimed&&missions(session,state).every(x=>x.done)){session.missionClaimed=true;state.ore+=75;state.total+=75;state.progress.insight+=1;events.push({type:'mission',text:'Outpost play bonus: +75 ore + 1 Insight.'});}return events;}
export function view(session,state){return {next:null,missions:missions(session,state),seconds:0,streak:0,missionClaimed:session.missionClaimed,complete:session.missionClaimed};}
