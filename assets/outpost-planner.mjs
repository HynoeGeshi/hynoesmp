/*! Copyright © 2026 Hynoe. All rights reserved. */
import {goalOptions,goalView} from './outpost-goals.mjs?v=20261023b';
import {PRESET_SLOTS,capturePreset,previewPreset,applyPreset} from './outpost-crew-presets.mjs?v=20261023b';
import {readPreferences,writePreferences} from './outpost-preferences.mjs?v=20261023b';

const number=n=>new Intl.NumberFormat('en',{maximumFractionDigits:1}).format(n);
const el=(tag,text='',className='')=>{const node=document.createElement(tag);node.textContent=text;node.className=className;return node;};
const duration=seconds=>seconds>=3600?number(seconds/3600)+' hours':number(seconds/60)+' minutes';
const routeNames={mine:'Mine',upgrades:'Workshop',research:'Research & gear',frontier:'Campaign',journal:'Legacy',crew:'Crew Deck',operations:'Operations Bay',expeditions:'Relic Hunts'};

export function mountPlanner({state,save,render,toast,openRoom,recap}){
  const $=id=>document.getElementById(id);
  let storage;try{storage=localStorage;}catch{storage=null;}
  let prefs=readPreferences(storage),optionsKey='',goalKey='',sourcesKey='',recapDismissed=false,recapRequested=false;
  const host=$('outpost-planner'),crewHost=$('crew-presets');
  if(!host||!crewHost)return {render(){},openRecap(){}};
  const heading=el('div','','planner-heading');heading.append(el('small','OUTPOST PLANNER'),el('h2','Your pinned goal'),el('p','Choose one target. Keep its remaining costs and useful routes in view.'));
  const controls=el('div','','planner-controls'),label=el('label','Choose a goal'),select=el('select'),pin=el('button','Pin goal'),clear=el('button','Clear pinned goal');
  select.id='pinned-goal-select';label.htmlFor=select.id;pin.id='pin-goal';clear.id='unpin-goal';
  controls.append(label,select,pin,clear);
  const goal=el('div','','pinned-goal-card'),title=el('h3','No goal pinned'),detail=el('p','Your automatic next move is still available below.'),requirements=el('ul'),sources=el('div','','goal-sources'),action=el('button','Open goal');
  title.id='pinned-goal-title';requirements.id='pinned-goal-requirements';action.id='pinned-goal-action';
  const message=el('p','','planner-message');message.id='planner-storage';message.setAttribute('role','status');
  goal.append(title,detail,requirements,sources,action);host.append(heading,controls,goal,message);
  const persist=()=>{const ok=writePreferences(storage,prefs);message.textContent=ok?'Saved on this device.':'Planner settings are available this session, but browser storage could not save them.';return ok;};
  pin.onclick=()=>{if(!goalView(state,select.value))return;prefs.goal=select.value;prefs.completedGoal=null;persist();drawGoal();};
  clear.onclick=()=>{prefs.goal=null;prefs.completedGoal=null;persist();drawGoal();};
  action.onclick=()=>{const view=goalView(state,prefs.goal);if(view)openRoom(view.target);};

  crewHost.append(el('h3','Saved crew presets'),el('p','Save your current lineup for mining, caves or dispatch. Preview its bonuses before applying it. Stations and active encounters keep their crews.'));
  const slots=new Map();
  for(const slot of PRESET_SLOTS){
    const row=el('article','','crew-preset'),team=el('p','No lineup saved'),bonus=el('p','','preset-bonus'),reason=el('p','','preset-reason'),buttons=el('div','','preset-actions'),capture=el('button','Save '+slot.label+' lineup'),apply=el('button','Apply '+slot.label+' preset');
    team.id='preset-'+slot.id+'-team';bonus.id='preset-'+slot.id+'-bonus';reason.id='preset-'+slot.id+'-reason';capture.id='preset-'+slot.id+'-save';apply.id='preset-'+slot.id+'-apply';
    buttons.append(capture,apply);row.append(el('h4',slot.label),team,bonus,reason,buttons);crewHost.append(row);
    capture.onclick=()=>{const next=capturePreset(state,prefs.presets,slot.id);if(!next){toast('This lineup cannot be saved. Check its crew assignments.');return;}prefs.presets=next;const ok=persist();renderPresets();toast(slot.label+' lineup '+(ok?'saved on this device.':'kept for this session; storage is unavailable.'));};
    apply.onclick=()=>{const result=applyPreset(state,prefs.presets,slot.id);if(!result.ok){toast(result.reason);renderPresets();return;}save();render();toast(slot.label+' preset applied.');};
    slots.set(slot.id,{team,bonus,reason,apply});
  }
  function renderPresets(){
    for(const slot of PRESET_SLOTS){const row=slots.get(slot.id),view=previewPreset(state,prefs.presets,slot.id);
      row.team.textContent=prefs.presets[slot.id]===null?'No lineup saved':view.names.length?view.names.join(' · '):'Empty lineup saved';
      row.bonus.textContent=view.bonuses?[['strike',view.bonuses.strike],['idle',view.bonuses.idle],['supplies',view.bonuses.supply]].map(([label,value])=>'+'+number((value-1)*100)+'% '+label).join(' · ')+' · '+number(view.bonuses.power)+' power'+(view.bonuses.synergy?' · Faction synergy':''):'';
      row.reason.textContent=view.reason||'Ready to apply';row.apply.disabled=!view.available;
    }
  }
  function drawGoal(){
    const options=goalOptions(state),key=JSON.stringify(options);
    if(key!==optionsKey){const selected=select.value;select.replaceChildren(...options.map(item=>{const option=el('option',item.label);option.value=item.id;return option;}));if(options.some(item=>item.id===selected))select.value=selected;optionsKey=key;}
    pin.disabled=!options.length;
    let view=goalView(state,prefs.goal);
    if(view?.completed&&!prefs.completedGoal){prefs.completedGoal={id:view.id,title:view.title};persist();}
    if(prefs.completedGoal?.id===prefs.goal)view={...view,id:prefs.goal,title:prefs.completedGoal.title,completed:true,requirements:[],sources:[],ready:false};
    const viewKey=JSON.stringify(view);clear.disabled=!prefs.goal;
    if(viewKey===goalKey)return;goalKey=viewKey;
    title.textContent=view?(view.completed?'✓ ':'')+view.title:'No goal pinned';
    detail.textContent=view?view.completed?'Goal completed. Pin another target whenever you are ready.':view.detail:'Choose a target above. Your automatic next move remains available below.';
    requirements.replaceChildren(...(view?.requirements||[]).map(item=>el('li',item.label+': '+number(item.have)+' / '+number(item.need)+' · '+number(item.remaining)+' remaining')));
    const routes=view&&!view.completed?view.sources:[],routesKey=JSON.stringify(routes);
    if(routesKey!==sourcesKey){sources.replaceChildren(...routes.map(source=>{const button=el('button',source.label);button.onclick=()=>openRoom(source.target);return button;}));sourcesKey=routesKey;}
    action.hidden=!view||view.completed;action.textContent=view?(view.ready?'Ready · ':'')+'Open '+(routeNames[view.target]||'goal')+' →':'Open goal';
  }
  const recapHost=$('offline-recap'),recapText=$('recap-details'),review=$('show-offline-recap');
  function drawRecap(){
    const present=recap&&recap.awaySeconds>=60;review.hidden=!present;recapHost.hidden=(!present&&!recapRequested)||recapDismissed;
    $('recap-title').textContent=present?'While you were away':'Offline earnings';
    if(!present){recapText.textContent='No offline earnings summary is available for this session yet. Reopen this page after at least one minute away to see production already credited, up to eight hours. Hire miners or build machines for ore, and staff stations for supplies, Insight or Intel.';return;}
    const earned=[number(recap.ore)+' ore',...Object.entries(recap.materials).map(([id,count])=>number(count)+' '+id),...(recap.insight?[number(recap.insight)+' Insight']:[]),...(recap.intel?[number(recap.intel)+' Intel']:[])];
    recapText.textContent='Away for '+duration(recap.awaySeconds)+'. Your outpost already credited '+earned.join(' · ')+'. '+(recap.capped?'The existing eight-hour production cap was reached.':'Production covered '+duration(recap.creditedSeconds)+'.')+' This summary adds no extra rewards.';
  }
  $('dismiss-offline-recap').onclick=()=>{recapDismissed=true;drawRecap();(review.hidden?$('open-help'):review).focus();};
  function openRecap(){recapRequested=true;recapDismissed=false;drawRecap();const close=$('dismiss-offline-recap');close.focus({preventScroll:true});close.scrollIntoView({block:'center',behavior:'instant'});}
  review.onclick=openRecap;
  drawRecap();
  return {render(){drawGoal();renderPresets();},openRecap};
}
