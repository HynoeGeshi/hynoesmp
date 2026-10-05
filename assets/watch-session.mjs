/*! Copyright © 2026 Hynoe. All rights reserved. See /COPYRIGHT.md. */
export const MILESTONES=[
 {seconds:600,label:'10 MIN',text:'+100 ore',reward:{ore:100}},
 {seconds:1500,label:'25 MIN',text:'+1 Insight',reward:{insight:1}},
 {seconds:2700,label:'45 MIN',text:'+1 Recruitment Mark',reward:{marks:1}},
 {seconds:3600,label:'60 MIN',text:'+250 ore + 1 Insight',reward:{ore:250,insight:1}}
];
export function todayKey(now=Date.now()){const d=new Date(now),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return d.getFullYear()+'-'+m+'-'+day;}
const clean=n=>Number.isFinite(n)&&n>=0?Math.floor(n):0;
const upgradeTotal=s=>['pick','crew','drill','forge'].reduce((sum,id)=>sum+clean(s?.[id]),0);
const activityTotal=s=>clean(s?.opsRuns)+clean(s?.progress?.surveys);
const snapshot=s=>({blocks:clean(s?.blocks),upgrades:upgradeTotal(s),activity:activityTotal(s)});
function previousDay(day){const d=new Date(day+'T12:00:00');d.setDate(d.getDate()-1);return todayKey(d.getTime());}
export function fresh(day,state,carry={}){const base=snapshot(state);return {version:1,day,seconds:0,claimed:[],missionClaimed:false,base,streak:clean(carry.streak),lastCompleted:typeof carry.lastCompleted==='string'?carry.lastCompleted:''};}
export function restore(raw,day,state){let p;try{p=typeof raw==='string'?JSON.parse(raw):raw;}catch{}if(!p||p.version!==1)return fresh(day,state);if(p.day!==day)return fresh(day,state,{streak:p.lastCompleted===previousDay(day)?clean(p.streak):0,lastCompleted:p.lastCompleted});const base=p.base&&typeof p.base==='object'?{blocks:clean(p.base.blocks),upgrades:clean(p.base.upgrades),activity:clean(p.base.activity)}:snapshot(state);return {version:1,day,seconds:Math.min(86400,clean(p.seconds)),claimed:Array.isArray(p.claimed)?[...new Set(p.claimed.filter(i=>Number.isInteger(i)&&i>=0&&i<MILESTONES.length))]:[],missionClaimed:!!p.missionClaimed,base,streak:clean(p.streak),lastCompleted:typeof p.lastCompleted==='string'?p.lastCompleted:''};}
export function missions(session,state){return [
 {id:'mine',label:'Open 5 veins',progress:Math.max(0,clean(state?.blocks)-session.base.blocks),target:5},
 {id:'build',label:'Buy 1 upgrade',progress:Math.max(0,upgradeTotal(state)-session.base.upgrades),target:1},
 {id:'explore',label:'Finish 1 operation or cave',progress:Math.max(0,activityTotal(state)-session.base.activity),target:1}
].map(x=>({...x,done:x.progress>=x.target}));}
function award(state,reward){const ore=clean(reward.ore),insight=clean(reward.insight),marks=clean(reward.marks);if(ore){state.ore+=ore;state.total+=ore;}if(insight)state.progress.insight+=insight;if(marks)state.progress.command.marks+=marks;}
export function tick(session,state,elapsed,visible=true){const events=[];if(!visible)return events;session.seconds=Math.min(86400,session.seconds+Math.min(5,Math.max(0,Number(elapsed)||0)));MILESTONES.forEach((m,i)=>{if(session.seconds>=m.seconds&&!session.claimed.includes(i)){session.claimed.push(i);award(state,m.reward);events.push({type:'drop',text:'Stream Run drop unlocked: '+m.text+'.'});}});const ms=missions(session,state);if(!session.missionClaimed&&ms.every(x=>x.done)){session.missionClaimed=true;award(state,{ore:75,insight:1});events.push({type:'mission',text:'Stream Run play bonus: +75 ore + 1 Insight.'});}if(session.seconds>=600&&session.lastCompleted!==session.day){session.streak=session.lastCompleted===previousDay(session.day)?session.streak+1:1;session.lastCompleted=session.day;events.push({type:'streak',text:'Stream-day streak: '+session.streak+'.'});}return events;}
export function view(session,state){const next=MILESTONES.find((_,i)=>!session.claimed.includes(i))||null,ms=missions(session,state);return {next,missions:ms,seconds:session.seconds,streak:session.streak,missionClaimed:session.missionClaimed,complete:!next};}
