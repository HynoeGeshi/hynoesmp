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
export const freshProgress=()=>({schema:2,chapter:0,insight:0,research:{precision:0,industry:0,survey:0},gear:{chisel:0,engine:0,lens:0},bag:Object.fromEntries(MATERIALS.map(k=>[k,0])),surveys:0,sectorWins:[0,0,0,0,0,0],run:null,trip:null,runsFailed:0,mastery:0,masteryBase:0,style:'outpost'});
export function restoreProgress(raw,now){const p=freshProgress();if(!raw||![1,2].includes(raw.schema))return p;p.chapter=clean(raw.chapter,12);p.insight=clean(raw.insight);p.surveys=clean(raw.surveys);p.runsFailed=clean(raw.runsFailed);p.mastery=clean(raw.mastery,10000);p.masteryBase=clean(raw.masteryBase);for(const r of RESEARCH)p.research[r.id]=clean(raw.research?.[r.id],r.max);for(const g of GEAR)p.gear[g.id]=clean(raw.gear?.[g.id],20);for(const m of MATERIALS)p.bag[m]=clean(raw.bag?.[m]);p.sectorWins=p.sectorWins.map((_,i)=>clean(raw.sectorWins?.[i]));if(['outpost','copper','crystal','rift'].includes(raw.style))p.style=raw.style;
const r=raw.run,c=Number.isInteger(r?.sector)?SECTORS[r.sector]:null;if(c&&c.chapter<=p.chapter){const room=clean(r.room,c.rooms);p.run={sector:r.sector,room,rooms:c.rooms,hp:Math.max(1,Math.min(100,clean(r.hp,100)||100)),haul:clean(r.haul,100000),ready:room>=c.rooms,last:typeof r.last==='string'?r.last.slice(0,180):'The next chamber waits.'};}
const t=raw.trip,c2=Number.isInteger(t?.sector)?SECTORS[t.sector]:null;if(!p.run&&c2&&c2.chapter<=p.chapter&&Number.isFinite(t.amount)&&t.amount>=0){p.run={sector:t.sector,room:c2.rooms,rooms:c2.rooms,hp:100,haul:clean(t.amount,100000),ready:true,last:'Your returning crew found the final cache. Claim it now—no waiting.'};}
return p;}
export const rankTotal=p=>Object.values(p.research).reduce((a,b)=>a+b,0);
export const gearTotal=p=>Object.values(p.gear).reduce((a,b)=>a+b,0);
export const strikeBonus=p=>1+p.research.precision*.12+p.gear.chisel*.08+Math.sqrt(p.mastery)*.05;
export const idleBonus=p=>1+p.research.industry*.10+p.gear.engine*.08+Math.sqrt(p.mastery)*.05;
export const supplyBonus=p=>1+p.research.survey*.10+p.gear.lens*.10;
export function goalValue(s,key){const p=s.progress;if(key==='crafted')return gearTotal(p);if(key==='research')return rankTotal(p);if(key==='surveys')return p.surveys;if(key.startsWith('sector'))return p.sectorWins[Number(key.slice(6))]||0;return s[key]||0;}
export function chapterStatus(s){const p=s.progress,c=CHAPTERS[p.chapter];if(!c)return null;const goals=c.goals.map(([key,target])=>({key,label:LABELS[key],target,value:goalValue(s,key)}));return {...c,goals,ready:goals.every(g=>g.value>=g.target)};}
export function claimChapter(s){const c=chapterStatus(s);if(!c?.ready)return false;s.progress.insight+=c.reward;s.progress.chapter++;return true;}
export function researchCost(p,id){const r=RESEARCH.find(r=>r.id===id);return r?Math.ceil(r.base*1.55**p.research[id]):Infinity;}
export function research(s,id){const p=s.progress,r=RESEARCH.find(r=>r.id===id),cost=researchCost(p,id);if(!r||p.research[id]>=r.max||p.insight<cost)return false;p.insight-=cost;p.research[id]++;return true;}
export function gearCost(p,id){const g=GEAR.find(g=>g.id===id);return g?{material:g.material,amount:Math.ceil(g.base*1.45**p.gear[id]),coal:5+3*p.gear[id]}:null;}
export function craft(s,id){const p=s.progress,g=GEAR.find(g=>g.id===id),c=gearCost(p,id);if(!c||p.gear[id]>=20||p.bag[c.material]<c.amount||p.bag.coal<c.coal)return false;p.bag[c.material]-=c.amount;p.bag.coal-=c.coal;p.gear[id]++;return true;}
export function startSurvey(s,sector){const p=s.progress,c=SECTORS[sector];if(!Number.isInteger(sector)||!c||c.chapter>p.chapter||p.run)return false;const fee=100*(sector+1)**2;if(s.ore<fee)return false;s.ore-=fee;p.run={sector,room:0,rooms:c.rooms,hp:100,haul:0,ready:false,last:'Your lantern catches a passage ahead. Choose how the crew enters.'};return true;}
export function advanceSurvey(s,action,rng=Math.random){const p=s.progress,r=p.run,c=SECTORS[r?.sector];if(!r||!c||r.ready||!['scout','mine','guard'].includes(action))return false;if(action==='guard'){const healed=Math.min(100-r.hp,14+Math.floor(rng()*9));r.hp+=healed;r.last=healed?'You reinforce the tunnel and recover '+healed+' health.':'The crew is already fully prepared.';return {healed,damage:0,haul:0,ready:false};}
const roll=Math.max(0,Math.min(.999999,Number(rng())||0)),danger=6+r.sector*2,damage=action==='mine'?Math.floor(danger*(.8+roll)):Math.floor(danger*(.35+roll*.55)),gain=Math.floor((action==='mine'?7:4)*(1+r.sector*.55)*(1+roll)*supplyBonus(p));r.hp=Math.max(0,r.hp-damage);r.haul+=gain;r.room++;r.ready=r.room>=r.rooms;if(r.hp<=0){p.runsFailed++;p.run=null;return {failed:true,damage,haul:gain,ready:false};}const moments=action==='mine'?['The wall bursts into a bright material cache.','A buried machine wakes, then yields its core.','The crew pries a rare seam from the rock.']:['You mark a safe route through the dark.','A lost survey sign points toward the cache.','Your lantern reveals a hidden bridge.'];r.last=moments[Math.floor(roll*moments.length)]+(damage?' The crew takes '+damage+' damage.':'');return {damage,haul:gain,ready:r.ready};}
export function collectSurvey(s){const p=s.progress,r=p.run;if(!r?.ready)return false;const c=SECTORS[r.sector],base=Math.floor((12+r.sector*8)*supplyBonus(p)),amount=base+r.haul;p.bag[c.material]+=amount;p.bag.coal+=Math.ceil(amount/2);p.insight+=2+r.sector*2;p.surveys++;p.sectorWins[r.sector]++;p.run=null;p.trip=null;return {material:c.material,amount,insight:2+r.sector*2};}
export function masteryStatus(s){const p=s.progress,target=5+Math.floor(p.mastery/3);return {target,value:Math.max(0,p.surveys-p.masteryBase),reward:20+p.mastery*2,ready:p.chapter===12&&p.surveys-p.masteryBase>=target};}
export function claimMastery(s){const q=masteryStatus(s);if(!q.ready)return false;const p=s.progress;p.insight+=q.reward;p.mastery++;p.masteryBase=p.surveys;return true;}
export const STYLES=[{id:'outpost',name:'Outpost green',chapter:0},{id:'copper',name:'Foundry ember',chapter:3},{id:'crystal',name:'Crystal violet',chapter:7},{id:'rift',name:'Rift aurora',chapter:12}];
export function setStyle(s,id){const style=STYLES.find(x=>x.id===id);if(!style||s.progress.chapter<style.chapter)return false;s.progress.style=id;return true;}

export function tradeInsight(s,material){const p=s.progress,i=SECTORS.findIndex(x=>x.material===material);if(i<0||p.chapter<SECTORS[i].chapter||p.insight<10)return false;p.insight-=10;p.bag[material]+=20;p.bag.coal+=10;return true;}
