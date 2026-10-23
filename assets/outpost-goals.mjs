/*! Copyright © 2026 Hynoe. All rights reserved. See /COPYRIGHT.md. */
import * as G from './watch-game.mjs?v=20261023a';

const amount=value=>Number.isFinite(value)?Math.max(0,value):0;
const level=value=>Math.floor(amount(value));
const materialName=id=>G.VEINS.find(x=>x.id===id)?.name||id;
const source=(label,target)=>({label,target});
const requirement=(label,have,need)=>({label,have:amount(have),need,remaining:Math.max(0,need-amount(have))});
const unique=sources=>sources.filter((item,index)=>sources.findIndex(x=>x.label===item.label&&x.target===item.target)===index);

function validState(s){
  const p=s?.progress;
  return !!(s&&typeof s==='object'&&p&&typeof p==='object'&&p.research&&p.gear&&p.bag&&p.crewDeck?.cards&&Array.isArray(p.crewDeck.active)&&Array.isArray(p.sectorWins)&&Array.isArray(s.relics));
}

function view(id,title,detail,target,requirements,sources,completed=false){
  return {id,title,detail,target,requirements:completed?[]:requirements,sources:completed?[]:unique(sources),ready:!completed&&requirements.every(x=>x.remaining===0),completed};
}

function caveSource(s,sector,material){
  return s.progress.chapter>=sector.chapter
    ?source('Collect '+material+' from '+sector.name+' caves','frontier')
    :source('Complete chapter '+sector.chapter+' to unlock '+sector.name+' caves','frontier');
}

function materialSources(s,id){
  const name=materialName(id),vein=G.VEINS.find(x=>x.id===id),sources=[];
  if(vein)sources.push(G.realm(s)>=vein.min
    ?source('Mine '+name+' veins','mine')
    :source('Reach '+(vein.min*50)+'m depth for '+name+' veins','mine'));
  const sector=G.SECTORS.find(x=>x.material===id);
  if(sector){
    sources.push(caveSource(s,sector,name));
    if(s.progress.chapter>=sector.chapter){
      sources.push(source('Trade 10 Insight for '+name+' supplies','research'));
      sources.push(source('Set a staffed Supply quarry to '+name,'crew'));
    }
  }
  if(id==='coal'){
    sources.push(source('Collect unlocked caves for coal','frontier'));
    sources.push(source('Staff a Supply quarry for coal','crew'));
  }
  if(id==='coal'||G.operationStatus(s).material===id)sources.push(source('Open veins, then choose Salvage Hold for '+name,'operations'));
  return sources;
}

function oreSources(){
  return [source('Mine veins for ore and depth','mine'),source('Build idle ore production','upgrades'),source('Open veins, then choose Rich Seam for ore','operations')];
}

function insightSources(s){
  return [
    source('Open 25 veins for 1 Insight; defeat Guardians for more','mine'),
    source('Collect unlocked caves for Insight','frontier'),
    source('Open veins, then choose Signal Chamber for Insight','operations'),
    source(s.progress.chapter<G.CHAPTERS.length?'Complete your current campaign chapter for Insight':'Complete Mastery goals for Insight','frontier'),
    source('Staff the Research foundry for Insight','crew')
  ];
}

function chapterSources(s,key){
  if(key.startsWith('sector')){
    const sector=G.SECTORS[Number(key.slice(6))];
    return sector?[caveSource(s,sector,materialName(sector.material))]:[];
  }
  const options={
    blocks:source('Open mining veins','mine'),
    crew:source('Hire miners in Workshop','upgrades'),
    drill:source('Build auto-drills in Workshop','upgrades'),
    orders:source('Claim completed Prospector challenges','mine'),
    crafted:source('Craft permanent equipment','research'),
    surveys:source('Collect unlocked cave expeditions','frontier'),
    research:source('Purchase permanent research ranks','research'),
    bossWins:source('Open veins, then defeat the Hollow Guardian','mine'),
    prestige:source('Build run ore and begin your next Legacy','journal')
  };
  return options[key]?[options[key]]:[];
}

export function goalOptions(state){
  if(!validState(state))return [];
  const p=state.progress,options=[];
  for(const u of G.UPGRADES)if(level(state[u.id])<250)options.push({id:'upgrade:'+u.id+':'+(level(state[u.id])+1),label:'Workshop · '+u.name+' · level '+(level(state[u.id])+1)});
  for(const r of G.RESEARCH)if(level(p.research[r.id])<r.max)options.push({id:'research:'+r.id+':'+(level(p.research[r.id])+1),label:'Research · '+r.name+' · rank '+(level(p.research[r.id])+1)});
  for(const g of G.GEAR)if(level(p.gear[g.id])<20)options.push({id:'gear:'+g.id+':'+(level(p.gear[g.id])+1),label:'Equipment · '+g.name+' · level '+(level(p.gear[g.id])+1)});
  const chapter=level(p.chapter);
  if(chapter<G.CHAPTERS.length)options.push({id:'chapter:'+(chapter+1),label:'Chapter '+(chapter+1)+' · '+G.CHAPTERS[chapter].name});
  if(level(state.prestige)<10000)options.push({id:'legacy:'+(level(state.prestige)+1),label:'Begin Legacy '+(level(state.prestige)+1)});
  return options;
}

export function goalView(state,id){
  if(!validState(state)||typeof id!=='string'||id.length>80)return null;
  const p=state.progress,purchase=/^(upgrade|research|gear):([a-z]+):([1-9]\d{0,4})$/.exec(id);
  if(purchase){
    const [,kind,key,rawTarget]=purchase,targetLevel=Number(rawTarget);
    const definitions=kind==='upgrade'?G.UPGRADES:kind==='research'?G.RESEARCH:G.GEAR;
    const def=definitions.find(x=>x.id===key),max=kind==='upgrade'?250:kind==='research'?def?.max:20;
    if(!def||targetLevel>max)return null;
    const current=level(kind==='upgrade'?state[key]:p[kind][key]),completed=current>=targetLevel;
    const title=def.name+' · '+(kind==='research'?'rank ':'level ')+targetLevel;
    if(completed)return view(id,title,'This target has been reached.',kind==='upgrade'?'upgrades':'research',[],[],true);
    if(kind==='upgrade'){
      let need=0;
      for(let n=current;n<targetLevel;n++)need+=G.cost({...state,[key]:n},key);
      return view(id,title,def.desc,'upgrades',[requirement('Ore',state.ore,need)],oreSources());
    }
    if(kind==='research'){
      let need=0;
      for(let n=current;n<targetLevel;n++)need+=G.researchCost({...p,research:{...p.research,[key]:n}},key);
      return view(id,title,def.desc,'research',[requirement('Insight',p.insight,need)],insightSources(state));
    }
    let material=0,coal=0;
    for(let n=current;n<targetLevel;n++){
      const cost=G.gearCost({...p,gear:{...p.gear,[key]:n}},key);
      material+=cost.amount;coal+=cost.coal;
    }
    return view(id,title,def.desc,'research',[
      requirement(materialName(def.material),p.bag[def.material],material),requirement('Coal',p.bag.coal,coal)
    ],[...materialSources(state,def.material),...materialSources(state,'coal')]);
  }
  const chapter=/^chapter:([1-9]\d?)$/.exec(id);
  if(chapter){
    const targetChapter=Number(chapter[1]),def=G.CHAPTERS[targetChapter-1];
    if(!def||targetChapter>level(p.chapter)+1)return null;
    const completed=level(p.chapter)>=targetChapter;
    const requirements=def.goals.map(([key,need])=>requirement(G.LABELS[key],G.goalValue(state,key),need));
    return view(id,'Chapter '+targetChapter+' · '+def.name,def.text,'frontier',requirements,def.goals.flatMap(([key])=>chapterSources(state,key)),completed);
  }
  const legacy=/^legacy:([1-9]\d{0,4})$/.exec(id);
  if(legacy){
    const targetLegacy=Number(legacy[1]);
    if(targetLegacy>10000||targetLegacy>level(state.prestige)+1)return null;
    const need=G.prestigeGoal({...state,prestige:targetLegacy-1});
    return view(id,'Begin Legacy '+targetLegacy,'Reset basic ore and machines for permanent power. Crew, research, equipment and discoveries carry forward.','journal',[
      requirement('Ore mined this Legacy',state.run,need)
    ],oreSources(),level(state.prestige)>=targetLegacy);
  }
  return null;
}
