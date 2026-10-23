/*! Copyright © 2026 Hynoe. All rights reserved. */
// Separate optional planner settings; the existing game save is never written here.
import {normalizePresets} from './outpost-crew-presets.mjs?v=20261023b';
export const PREFERENCES_KEY='hynoeOutpostPlannerV1';
function normalize(raw){
  const p=raw?.version===1?raw:{};
  const goal=typeof p.goal==='string'&&p.goal.length<=100&&/^[a-z]+:[a-z0-9]+(?::[0-9]+)?$/.test(p.goal)?p.goal:null;
  const completed=p.completedGoal;
  return {version:1,goal,presets:normalizePresets(p.presets),
    completedGoal:goal&&completed?.id===goal&&typeof completed.title==='string'&&completed.title.length>0&&completed.title.length<=160?{id:goal,title:completed.title}:null};
}
export function readPreferences(storage){
  try{return normalize(JSON.parse(storage?.getItem(PREFERENCES_KEY)||'null'));}catch{return normalize(null);}
}
export function writePreferences(storage,prefs){
  try{if(!storage)return false;storage.setItem(PREFERENCES_KEY,JSON.stringify(normalize(prefs)));return true;}catch{return false;}
}
