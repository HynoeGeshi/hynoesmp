/*! Copyright © 2026 Hynoe. All rights reserved. */
// Optional earnings display; never grants rewards or owns game saves.
const amount=value=>Number.isFinite(value)&&value>=0?value:0;
export function snapshot(state){
  return {ore:amount(state?.ore),insight:amount(state?.progress?.insight),
    intel:amount(state?.progress?.command?.intel),
    bag:Object.fromEntries(Object.entries(state?.progress?.bag||{}).map(([id,value])=>[id,amount(value)]))};
}
export function buildRecap({before,after,elapsed}={}){
  const awaySeconds=amount(elapsed),creditedSeconds=Math.min(28800,awaySeconds);
  const gain=(a,b)=>Math.max(0,amount(b)-amount(a));
  const materials={};
  for(const [id,value] of Object.entries(after?.bag||{})){
    const delta=gain(before?.bag?.[id],value);if(delta>0)materials[id]=delta;
  }
  return {awaySeconds,creditedSeconds,capped:awaySeconds>28800,
    ore:gain(before?.ore,after?.ore),insight:gain(before?.insight,after?.insight),
    intel:gain(before?.intel,after?.intel),materials};
}
export function saveStatus({ok,lastSavedAt}={}){
  if(ok===false)return 'Browser storage unavailable. Progress cannot be saved in this session.';
  if(ok!==true||!Number.isFinite(lastSavedAt))return 'Waiting for the first local save.';
  return 'Saved on this device at '+new Date(lastSavedAt).toLocaleTimeString([],{
    hour:'2-digit',minute:'2-digit',second:'2-digit'})+' · 8h offline mining cap';
}
