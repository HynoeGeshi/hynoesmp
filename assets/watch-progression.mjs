/*! Copyright © 2026 Hynoe. All rights reserved. See /COPYRIGHT.md. */
// Permanent progression. Pure rules shared by the browser and pacing tests.
export const MATERIALS=['coal','copper','gold','amethyst','diamond','ender','astral'];
export const RESEARCH=[
 {id:'precision',name:'Precision cutting',desc:'+12% strike yield per rank',base:3,max:12},
 {id:'industry',name:'Industrial engineering',desc:'+10% idle production per rank',base:3,max:12},
 {id:'survey',name:'Field logistics',desc:'+10% expedition supplies per rank',base:4,max:10}
];
export const GEAR=[
 {id:'chisel',name:'Surveyor’s chisel',desc:'+8% strike yield per level',material:'copper',base:12},
 {id:'engine',name:'Clockwork engine',desc:'+8% idle production per level',material:'gold',base:10},
 {id:'lens',name:'Prismatic lens',desc:'+10% expedition supplies per level',material:'amethyst',base:8}
];
export const SECTORS=[
 {name:'Outpost perimeter',story:'Repair the survey beacon and chart a route beneath the old mine.',material:'copper',rooms:5,chapter:0,icon:'🌲'},
 {name:'Flooded foundry',story:'Salvage the drowned machinery. Every recovered gear brings the outpost back to life.',material:'gold',rooms:7,chapter:2,icon:'⚙'},
 {name:'Glass cathedral',story:'Follow the resonance into a chamber of living crystal.',material:'amethyst',rooms:9,chapter:4,icon:'◇'},
 {name:'Sunken observatory',story:'Recover the star charts buried beneath the diamond fault.',material:'diamond',rooms:11,chapter:6,icon:'☄'},
 {name:'Rift frontier',story:'Anchor the unstable passage and bring your crew home.',material:'ender',rooms:13,chapter:8,icon:'◉'},
 {name:'Beyond the vault',story:'The vault was a doorway. Establish your first station on the other side.',material:'astral',rooms:15,chapter:10,icon:'✦'}
];
export const CREW_CARDS=[
 {id:'coalhand',name:'Mara Coalhand',title:'Vein Breaker',rarity:'common',faction:'Foundry',role:'Miner',icon:'⛏',strike:.05,idle:0,supply:0},
 {id:'lantern',name:'Eli Lantern',title:'Night Foreman',rarity:'common',faction:'Frontier',role:'Scout',icon:'◈',strike:0,idle:0,supply:.06},
 {id:'riveter',name:'June Riveter',title:'Rig Mechanic',rarity:'common',faction:'Foundry',role:'Engineer',icon:'⚙',strike:0,idle:.05,supply:0},
 {id:'packer',name:'Boone Packer',title:'Quartermaster',rarity:'common',faction:'Frontier',role:'Scout',icon:'▣',strike:.02,idle:0,supply:.04},
 {id:'copperjack',name:'Copper Jack',title:'Deep Cutter',rarity:'rare',faction:'Foundry',role:'Miner',icon:'◆',strike:.09,idle:.02,supply:0},
 {id:'fuse',name:'Imani Fuse',title:'Grid Architect',rarity:'rare',faction:'Foundry',role:'Engineer',icon:'⌁',strike:0,idle:.10,supply:.02},
 {id:'mapper',name:'Sable Mapper',title:'Route Seer',rarity:'rare',faction:'Frontier',role:'Scout',icon:'⌖',strike:.02,idle:0,supply:.11},
 {id:'warden',name:'The Iron Warden',title:'Crew Defender',rarity:'rare',faction:'Frontier',role:'Guard',icon:'⬡',strike:.05,idle:.05,supply:.04},
 {id:'violet',name:'Violet Resonance',title:'Crystal Savant',rarity:'epic',faction:'Astral',role:'Miner',icon:'◇',strike:.16,idle:.04,supply:.04},
 {id:'clockwork',name:'Clockwork Ren',title:'Master Builder',rarity:'epic',faction:'Foundry',role:'Engineer',icon:'✺',strike:.04,idle:.17,supply:.03},
 {id:'rift',name:'Nyx of the Rift',title:'Pathfinder',rarity:'epic',faction:'Astral',role:'Scout',icon:'◉',strike:.04,idle:.04,supply:.18},
 {id:'founder',name:'The First Founder',title:'Living Legend',rarity:'mythic',faction:'Astral',role:'Commander',icon:'✦',strike:.18,idle:.18,supply:.18},
 {id:'stardust',name:'Ada Stardust',title:'Beacon Apprentice',rarity:'common',faction:'Astral',role:'Engineer',icon:'✧',strike:0,idle:.04,supply:.02},
 {id:'moonshield',name:'Ro Moonshield',title:'Night Sentinel',rarity:'common',faction:'Astral',role:'Guard',icon:'☾',strike:.02,idle:.02,supply:.02},
 {id:'anvil',name:'Dax Anvil',title:'Tunnel Bulwark',rarity:'common',faction:'Foundry',role:'Guard',icon:'▰',strike:.03,idle:.03,supply:0},
 {id:'mosswire',name:'Kit Mosswire',title:'Camp Tinkerer',rarity:'common',faction:'Frontier',role:'Engineer',icon:'⌘',strike:0,idle:.04,supply:.02},
 {id:'comet',name:'Juno Comet',title:'Meteor Cutter',rarity:'rare',faction:'Astral',role:'Miner',icon:'☄',strike:.08,idle:0,supply:.05},
 {id:'eclipse',name:'Oren Eclipse',title:'Rift Shield',rarity:'rare',faction:'Astral',role:'Guard',icon:'◐',strike:.03,idle:.04,supply:.07},
 {id:'cinder',name:'Ash Cinder',title:'Furnace Pathfinder',rarity:'rare',faction:'Foundry',role:'Scout',icon:'♨',strike:.04,idle:.02,supply:.08},
 {id:'thorn',name:'Captain Thorn',title:'Wilds Protector',rarity:'epic',faction:'Frontier',role:'Guard',icon:'♜',strike:.06,idle:.06,supply:.12},
 {id:'flint',name:'Ruby Flint',title:'Hidden Seam Hunter',rarity:'epic',faction:'Frontier',role:'Miner',icon:'⬟',strike:.13,idle:.03,supply:.08},
 {id:'nova',name:'Nova Solstice',title:'Star Engine Architect',rarity:'epic',faction:'Astral',role:'Engineer',icon:'✵',strike:.03,idle:.15,supply:.06},
 {id:'ironheart',name:'Atlas Ironheart',title:'Founder of the Forge',rarity:'mythic',faction:'Foundry',role:'Commander',icon:'⚒',strike:.14,idle:.24,supply:.16},
 {id:'wildstar',name:'Lyra Wildstar',title:'Keeper of the Far Road',rarity:'mythic',faction:'Frontier',role:'Commander',icon:'✥',strike:.14,idle:.16,supply:.24},
 {id:'embermedic',name:'Nia Emberwell',title:'Forge Medic',rarity:'common',faction:'Foundry',role:'Guard',icon:'✚',strike:.01,idle:.02,supply:.03},
 {id:'reed',name:'Finch Reed',title:'Trail Courier',rarity:'common',faction:'Frontier',role:'Scout',icon:'➶',strike:0,idle:.02,supply:.04},
 {id:'orbit',name:'Pip Orbit',title:'Star Archivist',rarity:'common',faction:'Astral',role:'Scout',icon:'◎',strike:.01,idle:.01,supply:.04},
 {id:'brass',name:'Vera Brass',title:'Contract Broker',rarity:'rare',faction:'Foundry',role:'Scout',icon:'▤',strike:.02,idle:.03,supply:.08},
 {id:'cedar',name:'Cedar Vale',title:'Rescue Captain',rarity:'rare',faction:'Frontier',role:'Guard',icon:'⚑',strike:.02,idle:.05,supply:.07},
 {id:'quasar',name:'Quinn Quasar',title:'Void Scholar',rarity:'rare',faction:'Astral',role:'Engineer',icon:'✧',strike:.01,idle:.08,supply:.05},
 {id:'kiln',name:'Sol Kiln',title:'Coal Alchemist',rarity:'epic',faction:'Foundry',role:'Engineer',icon:'♨',strike:.02,idle:.14,supply:.08},
 {id:'briar',name:'Briar Fox',title:'Cache Stalker',rarity:'epic',faction:'Frontier',role:'Miner',icon:'◆',strike:.12,idle:.02,supply:.10},
 {id:'zenith',name:'Zed Zenith',title:'Route Weaver',rarity:'epic',faction:'Astral',role:'Scout',icon:'⌖',strike:.03,idle:.04,supply:.17},
 {id:'titan',name:'Titan Bell',title:'Heart of the Mountain',rarity:'mythic',faction:'Foundry',role:'Guard',icon:'⬡',strike:.20,idle:.20,supply:.14},
 {id:'verdant',name:'Mother Verdant',title:'Warden of Tomorrow',rarity:'mythic',faction:'Frontier',role:'Engineer',icon:'❖',strike:.10,idle:.24,supply:.20},
 {id:'cosmos',name:'Cosmo Horizon',title:'Keeper of Lost Stars',rarity:'mythic',faction:'Astral',role:'Commander',icon:'✦',strike:.16,idle:.16,supply:.22}
];
export const TALENTS={
 medic:{name:'Field medic',desc:'+4 healing per star when spending a ration.'},
 provisioner:{name:'Prepared camp',desc:'+1 starting ration. Multiple provisioners stack up to 5 total.'},
 shield:{name:'Hazard shield',desc:'Reduces all crossing damage by 3% per star.'},
 scout:{name:'Hidden paths',desc:'+8% safe-route supplies per star.'},
 miner:{name:'Cache breaker',desc:'+8% dangerous-cache supplies per star.'},
 rescue:{name:'Rescue line',desc:'+5 percentage points of retreat salvage per star, up to 80%.'},
 courier:{name:'Fast dispatch',desc:'Relic dispatches finish 4% faster per star, up to 40%.'},
 broker:{name:'Crew ambassador',desc:'+1 Recruitment Mark per completed relic dispatch.'},
 foreman:{name:'Station network',desc:'+3% production at all staffed stations per star while equipped.'},
 archivist:{name:'Recruitment archive',desc:'+1 Recruitment Mark per opened cache while equipped.'},
 alchemist:{name:'Coal recovery',desc:'+10% quarry coal per star while equipped.'},
 scholar:{name:'Field research',desc:'+1 Insight per star for completed caves.'}
};
const talents=['miner','scout','foreman','provisioner','miner','foreman','scout','shield','miner','foreman','rescue','scholar','foreman','shield','shield','alchemist','miner','shield','courier','rescue','miner','foreman','broker','scout','medic','courier','archivist','broker','rescue','scholar','alchemist','miner','scout','shield','provisioner','archivist'];
CREW_CARDS.forEach((card,index)=>card.talent=talents[index]);
export function crewTalents(p){const result=Object.fromEntries(Object.keys(TALENTS).map(k=>[k,0]));for(const id of p.crewDeck.active){const card=CREW_CARDS.find(c=>c.id===id);if(card&&p.crewDeck.cards[id])result[card.talent]+=p.crewDeck.cards[id].stars;}return result;}
export const CHAPTERS=[
 {name:'A foothold',text:'Build a crew that can keep the mine alive.',goals:[['blocks',20],['crew',1]],reward:4},
 {name:'Tools of the trade',text:'Turn raw finds into lasting equipment.',goals:[['crafted',1],['orders',2]],reward:5},
 {name:'The first survey',text:'Bring back field supplies and invest in a specialty.',goals:[['surveys',2],['research',2]],reward:6},
 {name:'Outpost engineer',text:'Build the machines that will support deeper journeys.',goals:[['crew',8],['drill',2],['blocks',150]],reward:8},
 {name:'The hollow wakes',text:'Face the guardian and prepare your expedition tools.',goals:[['bossWins',2],['crafted',4],['surveys',5]],reward:10},
 {name:'A lasting legacy',text:'Carry your discoveries into a stronger beginning.',goals:[['prestige',1],['research',6],['surveys',8]],reward:12},
 {name:'Crystal cartographers',text:'Map the cathedral and recover its fragments.',goals:[['sector2',3],['crafted',8],['blocks',600]],reward:15},
 {name:'A city below',text:'Grow beyond a camp into a permanent settlement.',goals:[['research',12],['surveys',18],['bossWins',6]],reward:18},
 {name:'Lost constellations',text:'Decipher the observatory’s records.',goals:[['sector3',4],['crafted',14],['prestige',3]],reward:22},
 {name:'Rift pioneers',text:'Prepare a crew that can endure the frontier.',goals:[['research',20],['surveys',35],['blocks',1800]],reward:26},
 {name:'The far side',text:'Stabilize the rift and chart what lies beyond.',goals:[['sector4',4],['crafted',20],['bossWins',12]],reward:32},
 {name:'Founders of the deep',text:'Establish a station beyond the vault. Mastery begins here.',goals:[['sector5',3],['research',28],['surveys',50],['prestige',5]],reward:40}
];
export const LABELS={blocks:'Veins opened',crew:'Miners owned this Legacy',drill:'Drills owned this Legacy',orders:'Prospector challenges',crafted:'Equipment levels crafted',surveys:'Field expeditions collected',research:'Research ranks',bossWins:'Guardians defeated',prestige:'Legacies begun',sector2:'Cathedral expeditions',sector3:'Observatory expeditions',sector4:'Rift expeditions',sector5:'Beyond-vault expeditions'};
const clean=(n,max=1e9)=>Number.isFinite(n)&&n>=0?Math.min(max,Math.floor(n)):0;
export const freshProgress=()=>({schema:4,chapter:0,insight:0,research:{precision:0,industry:0,survey:0},gear:{chisel:0,engine:0,lens:0},bag:Object.fromEntries(MATERIALS.map(k=>[k,0])),surveys:0,sectorWins:[0,0,0,0,0,0],run:null,trip:null,runsFailed:0,mastery:0,masteryBase:0,style:'outpost',command:freshCommand(),crewDeck:{cards:{},active:[],caches:0}});
export function restoreProgress(raw,now){const p=freshProgress();if(!raw||![1,2,3,4].includes(raw.schema))return p;p.chapter=clean(raw.chapter,12);p.insight=clean(raw.insight);p.surveys=clean(raw.surveys);p.runsFailed=clean(raw.runsFailed);p.mastery=clean(raw.mastery,10000);p.masteryBase=clean(raw.masteryBase);for(const r of RESEARCH)p.research[r.id]=clean(raw.research?.[r.id],r.max);for(const g of GEAR)p.gear[g.id]=clean(raw.gear?.[g.id],20);for(const m of MATERIALS)p.bag[m]=clean(raw.bag?.[m]);p.sectorWins=p.sectorWins.map((_,i)=>clean(raw.sectorWins?.[i]));if(['outpost','copper','crystal','rift'].includes(raw.style))p.style=raw.style;
const deck=raw.crewDeck;if(deck&&typeof deck==='object'){p.crewDeck.caches=clean(deck.caches,100000);for(const card of CREW_CARDS){const owned=deck.cards?.[card.id];if(owned&&typeof owned==='object'){const stars=Math.max(1,Math.min(5,clean(owned.stars,5)||1)),shards=clean(owned.shards,100000);p.crewDeck.cards[card.id]={stars,shards};}}if(Array.isArray(deck.active))p.crewDeck.active=[...new Set(deck.active.filter(id=>p.crewDeck.cards[id]&&CREW_CARDS.some(c=>c.id===id)))].slice(0,3);}
const r=raw.run,c=Number.isInteger(r?.sector)?SECTORS[r.sector]:null;if(c&&c.chapter<=p.chapter){const room=clean(r.room,c.rooms);p.run={sector:r.sector,room,rooms:c.rooms,hp:Math.max(1,Math.min(100,clean(r.hp,100)||100)),haul:clean(r.haul,100000),ready:room>=c.rooms,rations:raw.schema>=4?clean(r.rations,5):2,talents:Object.fromEntries(Object.keys(TALENTS).map(key=>[key,clean(r.talents?.[key],15)])),team:Object.fromEntries(['Miner','Engineer','Scout','Guard','Commander'].map(role=>[role,clean(r.team?.[role],15)])),yield:Math.max(1,Math.min(100,Number.isFinite(r.yield)?r.yield:1)),last:typeof r.last==='string'?r.last.slice(0,180):'The next chamber waits.'};}
const t=raw.trip,c2=Number.isInteger(t?.sector)?SECTORS[t.sector]:null;if(!p.run&&c2&&c2.chapter<=p.chapter&&Number.isFinite(t.amount)&&t.amount>=0){p.run={sector:t.sector,room:c2.rooms,rooms:c2.rooms,hp:100,haul:clean(t.amount,100000),ready:true,last:'Your returning crew found the final cache. Claim it now—no waiting.'};}
p.command=restoreCommand(raw.command,p);
return p;}
export const rankTotal=p=>Object.values(p.research).reduce((a,b)=>a+b,0);
export const gearTotal=p=>Object.values(p.gear).reduce((a,b)=>a+b,0);
export function crewBonuses(p){let strike=0,idle=0,supply=0,power=0;const active=p.crewDeck?.active||[];for(const id of active){const card=CREW_CARDS.find(c=>c.id===id),owned=p.crewDeck.cards[id];if(!card||!owned)continue;strike+=card.strike*owned.stars;idle+=card.idle*owned.stars;supply+=card.supply*owned.stars;power+=({common:80,rare:180,epic:420,mythic:1000}[card.rarity]||0)*owned.stars;}const factions=active.map(id=>CREW_CARDS.find(c=>c.id===id)?.faction),synergy=(active.length===3&&factions.every(x=>x===factions[0]))?.15:0;return {strike:1+strike+synergy,idle:1+idle+synergy,supply:1+supply+synergy,power,synergy};}
export const strikeBonus=p=>(1+p.research.precision*.12+p.gear.chisel*.08+Math.sqrt(p.mastery)*.05)*crewBonuses(p).strike;
export const idleBonus=p=>(1+p.research.industry*.10+p.gear.engine*.08+Math.sqrt(p.mastery)*.05)*crewBonuses(p).idle;
export const supplyBonus=p=>(1+p.research.survey*.10+p.gear.lens*.10)*crewBonuses(p).supply;
export function crewCacheStatus(s){const p=s.progress,score=Math.floor(s.blocks+p.surveys*3+(s.bossWins||0)*5+(s.expeditions||0)*2+p.chapter*5+(s.opsIntel||0)+p.command.intel),target=12*(p.crewDeck.caches+1);return {score,target,ready:score>=target,progress:Math.min(1,score/target),until:Math.max(0,target-score)};}
export function openCrewCache(s,rng=Math.random){const status=crewCacheStatus(s),p=s.progress;if(!status.ready)return false;const roll=Math.max(0,Math.min(.999999,Number(rng())||0)),pity=(p.crewDeck.caches+1)%10===0;let rarity;if(pity)rarity=roll<.82?'epic':'mythic';else rarity=roll<.60?'common':roll<.88?'rare':roll<.98?'epic':'mythic';const pool=CREW_CARDS.filter(c=>c.rarity===rarity&&(p.command.focus==='all'||c.faction===p.command.focus)),pick=Math.max(0,Math.min(.999999,Number(rng())||0)),card=pool[Math.floor(pick*pool.length)];const first=!p.crewDeck.cards[card.id],salvaged=p.crewDeck.cards[card.id]?.stars>=5;if(first)p.crewDeck.cards[card.id]={stars:1,shards:0};else if(salvaged)p.command.marks+=2;else p.crewDeck.cards[card.id].shards++;p.crewDeck.caches++;p.command.marks+=2+p.command.works.archive+p.crewDeck.active.filter(id=>CREW_CARDS.find(c=>c.id===id)?.talent==='archivist').length;awardCollection(p);return {card,first,pity,salvaged,owned:p.crewDeck.cards[card.id]};}
export function toggleCrew(s,id){const p=s.progress,active=p.crewDeck.active;if(p.run||s.expedition||Object.values(p.command.stations).some(x=>x.crew===id))return false;if(!p.crewDeck.cards[id]||!CREW_CARDS.some(c=>c.id===id))return false;const index=active.indexOf(id);if(index>=0){active.splice(index,1);return 'removed';}if(active.length>=3)return false;active.push(id);return 'added';}
export function upgradeCrew(s,id){const owned=s.progress.crewDeck.cards[id];if(!owned||owned.stars>=5)return false;const cost=owned.stars*2;if(owned.shards<cost)return false;owned.shards-=cost;owned.stars++;return {stars:owned.stars,cost};}
export function commandRank(s){const p=s.progress,xp=Math.floor(s.blocks*10+p.surveys*80+(s.bossWins||0)*180+p.chapter*350+(s.prestige||0)*700+p.crewDeck.caches*90+(s.opsRuns||0)*60),level=1+Math.floor(Math.sqrt(xp/180)),floor=(level-1)**2*180,ceil=level**2*180,names=['Rookie','Prospector','Foreman','Operator','Commander','Founder'];return {xp,level,name:names[Math.min(names.length-1,Math.floor((level-1)/5))],progress:ceil===floor?1:(xp-floor)/(ceil-floor),next:ceil};}
export function goalValue(s,key){const p=s.progress;if(key==='crafted')return gearTotal(p);if(key==='research')return rankTotal(p);if(key==='surveys')return p.surveys;if(key.startsWith('sector'))return p.sectorWins[Number(key.slice(6))]||0;return s[key]||0;}
export function chapterStatus(s){const p=s.progress,c=CHAPTERS[p.chapter];if(!c)return null;const goals=c.goals.map(([key,target])=>({key,label:LABELS[key],target,value:goalValue(s,key)}));return {...c,goals,ready:goals.every(g=>g.value>=g.target)};}
export function claimChapter(s){const c=chapterStatus(s);if(!c?.ready)return false;s.progress.insight+=c.reward;s.progress.chapter++;return true;}
export function researchCost(p,id){const r=RESEARCH.find(r=>r.id===id);return r?Math.ceil(r.base*1.55**p.research[id]):Infinity;}
export function research(s,id){const p=s.progress,r=RESEARCH.find(r=>r.id===id),cost=researchCost(p,id);if(!r||p.research[id]>=r.max||p.insight<cost)return false;p.insight-=cost;p.research[id]++;return true;}
export function gearCost(p,id){const g=GEAR.find(g=>g.id===id);return g?{material:g.material,amount:Math.ceil(g.base*1.45**p.gear[id]),coal:5+3*p.gear[id]}:null;}
export function craft(s,id){const p=s.progress,g=GEAR.find(g=>g.id===id),c=gearCost(p,id);if(!c||p.gear[id]>=20||p.bag[c.material]<c.amount||p.bag.coal<c.coal)return false;p.bag[c.material]-=c.amount;p.bag.coal-=c.coal;p.gear[id]++;return true;}
// Three route decisions replace repetitive room clicks. Crew is snapshotted at entry.
export function surveyTeam(p){const roles={};for(const id of p.crewDeck.active){const c=CREW_CARDS.find(c=>c.id===id);roles[c.role]=(roles[c.role]||0)+p.crewDeck.cards[id].stars;}return roles;}
export function surveyForecast(s,action){const r=s.progress.run;if(!r)return null;const team=r.team||{},hazard=['collapse','ambush','lost route'][Math.min(2,Math.floor(r.room/r.rooms*3))],role={collapse:'Engineer',ambush:'Guard','lost route':'Scout'}[hazard],protection=Math.min(.65,(team[role]||0)*.08+(team.Commander||0)*.04+(r.talents?.shield||0)*.03),base=(22+r.sector*7)*(action==='mine'?1.5:1)*(1-protection);return {hazard,role,min:Math.floor(base*.85),max:Math.floor(base*1.15)};}
export function startSurvey(s,sector){const p=s.progress,c=SECTORS[sector];if(!Number.isInteger(sector)||!c||c.chapter>p.chapter||p.run||s.expedition)return false;const fee=100*(sector+1)**2;if(s.ore<fee)return false;s.ore-=fee;const team=surveyTeam(p),talents=crewTalents(p);p.run={sector,room:0,rooms:c.rooms,hp:100,haul:0,ready:false,rations:Math.min(5,2+(team.Scout?1:0)+p.crewDeck.active.filter(id=>CREW_CARDS.find(c=>c.id===id)?.talent==='provisioner').length),team,talents,yield:supplyBonus(p),last:'Three crossings ahead. Inspect the hazard, preserve your rations, and choose your route.'};return true;}
export function advanceSurvey(s,action,rng=Math.random){const p=s.progress,r=p.run,c=SECTORS[r?.sector];if(!r||!c||r.ready||!['scout','mine','guard','retreat'].includes(action))return false;
if(action==='retreat'){const amount=Math.floor(r.haul*Math.min(.8,.4+(r.talents?.rescue||0)*.05));p.bag[c.material]+=amount;p.run=null;p.runsFailed++;return {retreated:true,amount,material:c.material};}
if(action==='guard'){if(!r.rations||r.hp>=100)return false;const healed=Math.min(100-r.hp,28+(r.team?.Guard||0)*3+(r.talents?.medic||0)*4);r.hp+=healed;r.rations--;r.last='Used one ration. Recovered '+healed+' health; '+r.rations+' rations remain.';return {healed,damage:0,haul:0,ready:false};}
const roll=Math.max(0,Math.min(.999999,Number(rng())||0)),q=surveyForecast(s,action),damage=Math.floor(q.min+(q.max-q.min)*roll),gain=Math.floor((action==='mine'?22:10)*(1+r.sector*.55)*(1+roll*.4)*(r.yield||1)*(1+(r.talents?.[action==='mine'?'miner':'scout']||0)*.08));r.hp=Math.max(0,r.hp-damage);r.haul+=gain;r.room=Math.min(r.rooms,r.room+Math.ceil(r.rooms/3));r.ready=r.room>=r.rooms;if(r.hp<=0){p.runsFailed++;p.run=null;return {failed:true,damage,haul:gain,ready:false};}r.last=(action==='mine'?'You mined the exposed cache.':'You followed the safer route.')+' '+damage+' damage · +'+gain+' supplies.';return {damage,haul:gain,ready:r.ready};}
export function collectSurvey(s){const p=s.progress,r=p.run;if(!r?.ready)return false;const c=SECTORS[r.sector],base=Math.floor((12+r.sector*8)*supplyBonus(p)),amount=base+r.haul;p.bag[c.material]+=amount;p.bag.coal+=Math.ceil(amount/2);p.insight+=2+r.sector*2+(r.talents?.scholar||0);p.surveys++;p.sectorWins[r.sector]++;p.run=null;p.trip=null;return {material:c.material,amount,insight:2+r.sector*2+(r.talents?.scholar||0)};}
export function masteryStatus(s){const p=s.progress,target=5+Math.floor(p.mastery/3);return {target,value:Math.max(0,p.surveys-p.masteryBase),reward:20+p.mastery*2,ready:p.chapter===12&&p.surveys-p.masteryBase>=target};}
export function claimMastery(s){const q=masteryStatus(s);if(!q.ready)return false;const p=s.progress;p.insight+=q.reward;p.mastery++;p.masteryBase=p.surveys;return true;}
export const STYLES=[{id:'outpost',name:'Outpost green',chapter:0},{id:'copper',name:'Foundry ember',chapter:3},{id:'crystal',name:'Crystal violet',chapter:7},{id:'rift',name:'Rift aurora',chapter:12}];
export function setStyle(s,id){const style=STYLES.find(x=>x.id===id);if(!style||s.progress.chapter<style.chapter)return false;s.progress.style=id;return true;}

export function tradeInsight(s,material){const p=s.progress,i=SECTORS.findIndex(x=>x.material===material);if(i<0||p.chapter<SECTORS[i].chapter||p.insight<10)return false;p.insight-=10;p.bag[material]+=20;p.bag.coal+=10;return true;}

// Permanent command economy: reserve assignments, earned recruitment, and endgame works.
export const STATIONS=[
 {id:'quarry',name:'Supply quarry',role:'Miner',seconds:60,desc:'Automatically gathers your chosen material and coal. Every second delivery opens a vein toward campaign goals.'},
 {id:'beacon',name:'Signal bureau',role:'Scout',seconds:150,desc:'Generates activity toward Crew Caches without repeated mining.'},
 {id:'academy',name:'Research foundry',role:'Engineer',seconds:600,desc:'Produces Insight for permanent research and field equipment.'}
];
export const WORKS=[
 {id:'depot',name:'Deep supply network',chapter:4,material:'gold',amount:120,insight:20,desc:'+20% production at every staffed station per rank.'},
 {id:'archive',name:'Astral crew archive',chapter:8,material:'diamond',amount:180,insight:40,desc:'One extra Recruitment Mark from each new Crew Cache per rank.'},
 {id:'gate',name:'Worldgate',chapter:12,material:'astral',amount:250,insight:80,desc:'Unlocks repeatable Deep Command contracts with rising delivery goals. Each gate rank improves rewards.'}
];
export function freshCommand(){return {marks:0,intel:0,focus:'all',collectionRewards:0,material:'copper',stations:Object.fromEntries(STATIONS.map(x=>[x.id,{crew:'',level:1,work:0}])),works:{depot:0,archive:0,gate:0},contracts:0,contractBase:0,quarryDeliveries:0};}
function restoreCommand(raw,p){const c=freshCommand();if(!raw||typeof raw!=='object')return c;for(const key of ['marks','intel','contracts','contractBase','quarryDeliveries','collectionRewards'])c[key]=clean(raw[key]);c.collectionRewards=Math.min(6,c.collectionRewards);if(['all','Foundry','Frontier','Astral'].includes(raw.focus))c.focus=raw.focus;const sector=SECTORS.find(x=>x.material===raw.material);if(sector&&p.chapter>=sector.chapter)c.material=raw.material;const used=new Set(p.crewDeck.active);for(const def of STATIONS){const r=raw.stations?.[def.id],slot=c.stations[def.id];slot.level=Math.max(1,clean(r?.level,5));slot.work=Number.isFinite(r?.work)?Math.max(0,Math.min(.999999,r.work)):0;if(p.crewDeck.cards[r?.crew]&&!used.has(r.crew)){slot.crew=r.crew;used.add(r.crew);}}for(const w of WORKS)c.works[w.id]=clean(raw.works?.[w.id],5);c.contractBase=clean(raw.contractBase);return c;}
export function stationRate(p,id){const def=STATIONS.find(x=>x.id===id),slot=p.command.stations[id],card=CREW_CARDS.find(x=>x.id===slot?.crew),owned=p.crewDeck.cards[slot?.crew];if(!def||!card||!owned)return 0;return (1+(owned.stars-1)*.25)*(card.role===def.role?1.5:1)*slot.level*(1+crewTalents(p).foreman*.03+p.command.works.depot*.2+Math.floor(Object.keys(p.crewDeck.cards).length/6)*.05)/def.seconds;}
export function assignStation(s,id,crew){const p=s.progress,slot=p.command.stations[id];if(!STATIONS.some(x=>x.id===id)||!slot)return false;if(crew&&(!p.crewDeck.cards[crew]||p.crewDeck.active.includes(crew)||Object.entries(p.command.stations).some(([key,x])=>key!==id&&x.crew===crew)))return false;slot.crew=crew;return true;}
export function stationCost(p,id){const level=p.command.stations[id]?.level;return {material:'copper',amount:Math.ceil(30*2**(level-1)),insight:5*level};}
export function upgradeStation(s,id){const p=s.progress,slot=p.command.stations[id];if(!STATIONS.some(x=>x.id===id)||!slot||slot.level>=5)return false;const c=stationCost(p,id);if(p.bag[c.material]<c.amount||p.insight<c.insight)return false;p.bag[c.material]-=c.amount;p.insight-=c.insight;slot.level++;return true;}
export function setQuarryMaterial(s,material){const sector=SECTORS.find(x=>x.material===material);if(!sector||s.progress.chapter<sector.chapter)return false;s.progress.command.material=material;return true;}
export function tickCommand(s,elapsed){const p=s.progress,c=p.command,dt=Math.min(28800,Math.max(0,Number.isFinite(elapsed)?elapsed:0));for(const def of STATIONS){const slot=c.stations[def.id],work=slot.work+stationRate(p,def.id)*dt,count=Math.floor(work+1e-9);slot.work=Math.max(0,work-count);if(!count)continue;if(def.id==='quarry'){p.bag[c.material]+=count;const before=c.quarryDeliveries;c.quarryDeliveries+=count;const coalBonus=crewTalents(p).alchemist*.1;p.bag.coal+=count+Math.floor(c.quarryDeliveries*coalBonus)-Math.floor(before*coalBonus);s.blocks+=Math.floor(c.quarryDeliveries/2)-Math.floor(before/2);}if(def.id==='beacon')c.intel+=count;if(def.id==='academy')p.insight+=count;}}
export function recruitCost(id){return {common:6,rare:12,epic:30,mythic:80}[CREW_CARDS.find(x=>x.id===id)?.rarity]||Infinity;}
export function recruitCrew(s,id){const p=s.progress,cost=recruitCost(id),owned=p.crewDeck.cards[id];if(!Number.isFinite(cost)||p.command.marks<cost||owned?.stars>=5)return false;p.command.marks-=cost;if(owned)owned.shards++;else p.crewDeck.cards[id]={stars:1,shards:0};awardCollection(p);return true;}
export function workCost(p,id){const w=WORKS.find(x=>x.id===id);if(!w)return null;const rank=p.command.works[id];return {material:w.material,amount:w.amount*(rank+1)**2,insight:w.insight*(rank+1),rank,unlocked:p.chapter>=w.chapter};}
export function buildWork(s,id){const p=s.progress,c=workCost(p,id);if(!c||!c.unlocked||c.rank>=5||p.bag[c.material]<c.amount||p.insight<c.insight)return false;p.bag[c.material]-=c.amount;p.insight-=c.insight;if(id==='gate'&&p.command.works.gate===0)p.command.contractBase=p.sectorWins[5];p.command.works[id]++;return true;}
export function commandContract(s){const c=s.progress.command,tier=c.contracts+1,gate=c.works.gate;return {tier,unlocked:gate>0,target:3+Math.floor(tier/3),value:Math.max(0,s.progress.sectorWins[5]-c.contractBase),material:100*tier,marks:10+gate*2,insight:30+gate*10};}
export function claimCommandContract(s){const q=commandContract(s),p=s.progress;if(!q.unlocked||q.value<q.target||p.bag.astral<q.material)return false;p.bag.astral-=q.material;p.command.marks+=q.marks;p.insight+=q.insight;p.command.contracts++;p.command.contractBase=p.sectorWins[5];return true;}

export function setCacheFocus(s,faction){if(!['all','Foundry','Frontier','Astral'].includes(faction))return false;s.progress.command.focus=faction;return true;}
function awardCollection(p){const earned=Math.floor(Object.keys(p.crewDeck.cards).length/6);while(p.command.collectionRewards<earned){p.command.collectionRewards++;p.command.marks+=p.command.collectionRewards*5;}}
export function refineShards(s,id){const p=s.progress,card=p.crewDeck.cards[id];if(!card||card.stars<5||!card.shards)return false;p.command.marks+=card.shards*2;card.shards=0;return true;}
