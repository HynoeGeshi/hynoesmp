/*! Copyright © 2026 Hynoe. All rights reserved. See /COPYRIGHT.md. */

export const CURRENT_SAVE_KEY='hynoeOutpostV1';
export const LEGACY_SAVE_KEY='hynoeDeepDeeperV1';

function parse(raw){
  if(!raw)return null;
  try{
    const value=typeof raw==='string'?JSON.parse(raw):raw;
    return value&&typeof value==='object'&&value.version===1?value:null;
  }catch{return null;}
}

function n(value){return Number.isFinite(value)&&value>0?value:0;}
function objectSize(value){return value&&typeof value==='object'?Object.keys(value).length:0;}

export function saveProgressScore(raw){
  const s=parse(raw);
  if(!s)return -1;
  const p=s.progress&&typeof s.progress==='object'?s.progress:{};
  const deck=p.crewDeck&&typeof p.crewDeck==='object'?p.crewDeck:{};
  return (
    n(s.total)*1e-6+
    n(s.run)*5e-7+
    n(s.blocks)*4+
    n(s.strikes)*0.01+
    n(s.prestige)*5000+
    n(s.bossWins)*1200+
    n(s.expeditions)*200+
    n(s.opsRuns)*120+
    n(p.chapter)*1500+
    n(p.surveys)*350+
    n(deck.caches)*250+
    objectSize(deck.cards)*300+
    (Array.isArray(deck.active)?deck.active.length:0)*200+
    (Array.isArray(s.relics)?s.relics.length:0)*1000+
    objectSize(s.discoveries)*100
  );
}

function values(value){return value&&typeof value==='object'?Object.values(value):[];}

function hasProgress(s){
  const p=s.progress&&typeof s.progress==='object'?s.progress:{};
  const c=p.command&&typeof p.command==='object'?p.command:{};
  // Clocks and freshly generated veins alone are not evidence of gameplay.
  return saveProgressScore(s)>0||
    ['ore','pick','crew','drill','forge','quest','orders','orderBase','opsBase','guardianBase'].some(key=>n(s[key])>0)||
    n(s.depth)>1||values(s.badges).length>0||!!s.guardian||!!s.expedition||!!p.run||!!p.trip||
    ['insight','mastery','masteryBase','runsFailed'].some(key=>n(p[key])>0)||
    ['research','gear','bag','sectorWins'].some(key=>values(p[key]).some(value=>n(value)>0))||
    ['marks','intel','collectionRewards','contracts','contractBase','quarryDeliveries'].some(key=>n(c[key])>0)||
    values(c.works).some(value=>n(value)>0)||
    values(c.stations).some(slot=>slot&&(!!slot.crew||n(slot.level)>1||n(slot.work)>0))||
    !!(p.style&&p.style!=='outpost')||!!(c.focus&&c.focus!=='all')||!!(c.material&&c.material!=='copper');
}

export function chooseSave(currentRaw,legacyRaw){
  const current=parse(currentRaw),legacy=parse(legacyRaw);
  if(!current&&legacy)return {source:'legacy',raw:legacyRaw};
  if(current&&!legacy)return {source:'current',raw:currentRaw};
  if(!current&&!legacy)return {source:'none',raw:null};
  // Spending or reassigning crew can lower a score without losing progress.
  // Recover only a pristine current save; a played current save stays authoritative.
  if(!hasProgress(current)&&hasProgress(legacy))return {source:'legacy',raw:legacyRaw};
  return {source:'current',raw:currentRaw};
}

export function recoverBestLocalSave(storage=globalThis.localStorage){
  if(!storage)return {source:'none',recovered:false};
  try{
    const current=storage.getItem(CURRENT_SAVE_KEY);
    const legacy=storage.getItem(LEGACY_SAVE_KEY);
    const selected=chooseSave(current,legacy);
    if(selected.source==='legacy'&&selected.raw){
      storage.setItem(CURRENT_SAVE_KEY,selected.raw);
      return {source:'legacy',recovered:true};
    }
    return {source:selected.source,recovered:false};
  }catch{return {source:'none',recovered:false};}
}

export const recoveryResult=recoverBestLocalSave();
