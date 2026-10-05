
(()=>{
  const body=document.body;
  const hotbar=document.querySelector('.hotbar');
  if(hotbar&&!hotbar.querySelector('[data-outpost-link]')){
    const link=document.createElement('a');link.href='watch.html';link.className='hotbar-slot outpost-slot';link.dataset.outpostLink='true';link.innerHTML='<span>▶</span><b>Watch, Play<br>& Chat</b>';hotbar.insertBefore(link,hotbar.children[1]||null);
  }
  document.querySelectorAll('.hud-action.youtube').forEach(a=>{a.textContent='▶ WATCH, PLAY & CHAT';});
  const page=body.dataset.page||'home';
  const chapters=[
    ['start','Start Here','First-Day Foundations'],
    ['mca','Village Life','Minecraft Comes Alive'],
    ['progression','Progression','Gear + Long-Term Roadmap'],
    ['economy','Economy','Dollars, Tokens + Jobs+'],
    ['bosses','Bosses','Endgame + World Boss Route'],
    ['join','Join','Enter Hynoe SMP']
  ];
  const key='hynoeSmpGuideVisitedV2';
  let visited=[];
  try{visited=JSON.parse(localStorage.getItem(key)||'[]'); if(!Array.isArray(visited))visited=[];}catch{visited=[];}
  const isGuide=chapters.some(c=>c[0]===page);
  let newly=false;
  if(isGuide&&!visited.includes(page)){visited.push(page);newly=true;try{localStorage.setItem(key,JSON.stringify(visited));}catch{/* Guide remains usable when storage is unavailable. */}}
  const completeCount=chapters.filter(c=>visited.includes(c[0])).length;
  const pct=Math.round((completeCount/chapters.length)*100);
  const fill=document.getElementById('guide-progress-fill'),label=document.getElementById('guide-progress-label');
  if(fill)fill.style.width=pct+'%'; if(label)label.textContent=pct+'%';
  const list=document.getElementById('quest-list');
  if(list){
    list.innerHTML=chapters.map((c,i)=>{
      const done=visited.includes(c[0]);
      return `<a class="journal-quest ${done?'complete':''}" href="${c[0]}.html"><i>${done?'✓':String(i+1).padStart(2,'0')}</i><div><b>${c[1]}</b><small>${c[2]}</small></div></a>`;
    }).join('');
  }
  const reward=document.getElementById('journal-reward');
  if(reward&&completeCount===chapters.length){reward.classList.add('unlocked');reward.querySelector('p').textContent='Unlocked. You have explored the full Hynoe SMP guide.';}
  const journal=document.getElementById('quest-journal'),scrim=document.querySelector('.journal-scrim');
  let journalTrigger=null;
  if(journal){journal.inert=true;journal.setAttribute('role','dialog');journal.setAttribute('aria-modal','true');journal.setAttribute('aria-label',"Adventurer's Journal");}
  function setJournal(open){
    if(!journal||!scrim)return;
    if(open)journalTrigger=document.activeElement;
    journal.inert=!open;
    document.body.classList.toggle('journal-open',open);
    journal.classList.toggle('open',open);scrim.classList.toggle('open',open);journal.setAttribute('aria-hidden',String(!open));
    document.querySelectorAll('[data-journal-toggle]').forEach(b=>b.setAttribute('aria-expanded',String(open)));
    if(open)journal.querySelector('button').focus();else if(journalTrigger)journalTrigger.focus();
  }
  document.querySelectorAll('[data-journal-toggle]').forEach(b=>b.addEventListener('click',()=>{if(journal)setJournal(!journal.classList.contains('open'));}));
  document.addEventListener('keydown',e=>{if(!journal?.classList.contains('open'))return;
    if(e.key==='Escape')setJournal(false);
    if(e.key==='Tab'){const items=[...journal.querySelectorAll('a[href],button')];const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
  const obs='IntersectionObserver' in window ? new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}}),{threshold:.08}) : {observe:el=>el.classList.add('visible')};
  document.documentElement.classList.add('reveal-ready');
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
  document.querySelectorAll('.hotbar a').forEach(a=>{if(a.getAttribute('href')===(location.pathname.split('/').pop()||'index.html')){a.classList.add('active');a.setAttribute('aria-current','page');}});
  const tabs=document.querySelectorAll('.vault-tabs button');
  if(tabs.length){tabs.forEach(btn=>btn.addEventListener('click',()=>{tabs.forEach(b=>b.classList.remove('active'));btn.classList.add('active');const tier=btn.dataset.tier;document.querySelectorAll('#vault-grid article').forEach(card=>card.classList.toggle('hidden',tier!=='all'&&card.dataset.tier!==tier));}));}
  if(newly){
    const t=document.getElementById('achievement-toast'),n=document.getElementById('achievement-name');
    const found=chapters.find(c=>c[0]===page);if(n&&found)n.textContent=found[1]+' Discovered';
    if(t){setTimeout(()=>t.classList.add('show'),350);setTimeout(()=>t.classList.remove('show'),3600);}
  }

// v3 world atmosphere + location HUD
const worldMeta={
 home:['W','WORLD HUB','HYNOE OVERWORLD','X: 0  Z: 0'],
 start:['01','PLAINS OUTPOST','FIRST-DAY ROUTE','X: 124  Z: -88'],
 mca:['02','VILLAGE DISTRICT','MCA SETTLEMENT','X: 418  Z: 236'],
 progression:['03','DEEP MINES','POWER ROADMAP','Y: -42'],
 economy:['04','MARKET DISTRICT','PLAYER TRADE','X: -215  Z: 610'],
 bosses:['05','FORBIDDEN SHRINE','ENDGAME ROUTE','DANGER'],
 join:['06','PORTAL GATE','SERVER ENTRY','READY']
};
const meta=worldMeta[page]||worldMeta.home;
const ctx=document.createElement('div');ctx.className='world-context';ctx.innerHTML=`<div class="wc-icon">${meta[0]}</div><div class="wc-copy"><small>CURRENT LOCATION</small><b>${meta[1]}</b><em>${meta[2]} // ${meta[3]}</em></div>`;document.body.appendChild(ctx);
const particles=document.createElement('div');particles.className='world-particles';particles.setAttribute('aria-hidden','true');particles.innerHTML='<i></i>'.repeat(8);document.body.appendChild(particles);
const firstHero=document.querySelector('.chapter-hero');
if(firstHero){const plaque=document.createElement('section');plaque.className='biome-card reveal';plaque.innerHTML=`<div class="biome-card-inner"><i>${meta[0]}</i><div><small>DISCOVERED LOCATION</small><b>${meta[1]}</b></div><span>${meta[2]} // ${meta[3]}</span></div>`;firstHero.insertAdjacentElement('afterend',plaque);obs.observe(plaque);}
let ticking=false;window.addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(()=>{document.documentElement.style.setProperty('--world-scroll',window.scrollY+'px');ticking=false;});ticking=true;}},{passive:true});

// v4: turn every guide page into the same purpose-first app shell as Deep & Deeper.
const appMeta={
 home:{icon:'⌂',label:'WORLD COMMAND',title:'Choose your way into Hynoe SMP',task:'Pick the part of the world you want to understand, then follow its route.',reward:'Know exactly where to start before installing or joining.',cta:'Start the first-day route',href:'start.html'},
 start:{icon:'⛏',label:'ACTIVE MISSION',title:'Complete your first safe day',task:'Use the checklist, copy the commands you need, and establish one reliable home base.',reward:'Food, shelter, navigation, and a clear next objective.',cta:'Jump to first-day steps',href:'#first-day-steps'},
 mca:{icon:'♟',label:'SETTLEMENT MISSION',title:'Turn villagers into a living community',task:'Build safe housing, relationships, workplaces, families, and defenses in that order.',reward:'A settlement with stories, trade, and long-term purpose.',cta:'Open the village route',href:'#village-route'},
 progression:{icon:'✦',label:'POWER MISSION',title:'Build power without skipping the journey',task:'Advance through Genesis Ages, the Campaign, equipment, exploration, and boss materials.',reward:'New capabilities, stronger gear, and meaningful endgame routes.',cta:'Open the power map',href:'#genesis-ages'},
 economy:{icon:'◆',label:'MARKET MISSION',title:'Choose how your play becomes value',task:'Use Dollars for trade, Tokens for progression rewards, and Jobs+ for profession growth.',reward:'A sustainable income path without confusing the three balances.',cta:'Compare currencies',href:'#currency-map'},
 bosses:{icon:'⚔',label:'ENDGAME MISSION',title:'Prepare before you summon',task:'Study the route, stage supplies, protect nearby builds, and agree on team loot.',reward:'Rare materials, boss progression, and the Worldbreaker route.',cta:'Study the boss route',href:'#boss-route'},
 join:{icon:'⬢',label:'PORTAL MISSION',title:'Enter the server with the right client',task:'Join Discord, install the pack, learn Genesis gates, then create your first anchor.',reward:'A clean first login without missing-mod or progression confusion.',cta:'Open install guide',href:'modpack.html'},
 updates:{icon:'✧',label:'UPDATE TERMINAL',title:'See what changed before you play',task:'Scan rewards, commands, campaign clarity, and seasonal changes that affect your next session.',reward:'No guessing about new systems or the current rollout.',cta:'Jump to player commands',href:'#commands'}
};
const app=appMeta[page]||appMeta.home,main=document.querySelector('main');
const safeId=value=>(value||'zone').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,42)||'zone';
const iconFor=text=>{const t=text.toLowerCase();if(/command|help|start|first|install/.test(t))return'⌘';if(/village|settle|family|home/.test(t))return'♟';if(/money|market|econom|vault|trade|reward/.test(t))return'◆';if(/boss|fight|shrine|danger|encounter/.test(t))return'⚔';if(/campaign|progress|age|gear|power|roadmap/.test(t))return'✦';if(/join|portal|server|arrival/.test(t))return'⬢';if(/stream|watch|viewer/.test(t))return'▶';if(/update|season|latest/.test(t))return'✧';return'◇';};
const classTitles={
  'biome-card':'Discovered location','command-workbench':'Quick command bench','world-context':'Current location',
  'server-support':'Support the server','campaign-roadmap':'Campaign roadmap','economy-basics':'Economy basics',
  'server-address':'Server address','site-notice':'Important world notice','viewer-ribbon':'Viewer outpost',
  'arrival-actions':'Arrival actions','invite-panel':'Invite your crew'
};
const sectionTitle=section=>{const heading=section.querySelector('h1,h2,h3'),classTitle=[...section.classList].map(name=>classTitles[name]).find(Boolean);return(heading?.textContent||section.getAttribute('aria-label')||classTitle||'Explore this system').trim();};
function showAppToast(message){let toast=document.getElementById('app-toast');if(!toast){toast=document.createElement('div');toast.id='app-toast';toast.className='app-toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');document.body.append(toast);}toast.textContent=message;toast.classList.add('show');clearTimeout(showAppToast.timer);showAppToast.timer=setTimeout(()=>toast.classList.remove('show'),2600);}
if(main){
  const first=main.querySelector(':scope > section');
  const mission=document.createElement('section');mission.className='app-mission';mission.setAttribute('aria-label','Current page mission');
  mission.innerHTML=`<div class="app-mission-icon" aria-hidden="true">${app.icon}</div><div class="app-mission-copy"><small>${app.label}</small><h2>${app.title}</h2><p><b>DO:</b> ${app.task}</p><p><b>GET:</b> ${app.reward}</p></div><div class="app-mission-progress"><span>WORLD GUIDE</span><strong>${pct}%</strong><div><i style="width:${pct}%"></i></div><small>${completeCount} / ${chapters.length} guide zones discovered</small></div><div class="app-mission-actions"><a class="app-primary" href="${app.href}">${app.cta}</a><button type="button" id="zone-map-toggle" aria-expanded="false">Open page map</button></div>`;
  if(first)first.insertAdjacentElement('afterend',mission);else main.prepend(mission);
  const candidates=[...main.querySelectorAll(':scope > section')].filter(section=>!section.classList.contains('app-mission')&&!section.matches('.chapter-hero,.world-gate,.portal-hero'));
  const zones=candidates.map((section,index)=>{const title=sectionTitle(section),icon=iconFor(title);if(!section.id)section.id=`zone-${safeId(title)}-${index+1}`;section.classList.add('app-zone');section.dataset.zoneIcon=icon;section.dataset.zoneNumber=String(index+1).padStart(2,'0');const stamp=document.createElement('span');stamp.className='zone-stamp';stamp.setAttribute('aria-hidden','true');stamp.innerHTML=`<i>${icon}</i><b>${String(index+1).padStart(2,'0')}</b>`;section.prepend(stamp);return{section,title,icon,index};});
  if(zones.length){
    const dock=document.createElement('nav');dock.className='zone-dock';dock.id='zone-dock';dock.setAttribute('aria-label','Page map');dock.innerHTML='<div class="zone-dock-head"><span>PAGE MAP</span><b>'+zones.length+' ZONES</b></div><div class="zone-dock-list"></div>';
    const dockList=dock.querySelector('.zone-dock-list');zones.forEach(({section,title,icon,index})=>{const a=document.createElement('a');a.href='#'+section.id;a.dataset.zoneTarget=section.id;a.innerHTML=`<i>${icon}</i><span><small>ZONE ${String(index+1).padStart(2,'0')}</small><b>${title}</b></span>`;dockList.append(a);});document.body.append(dock);
    const toggle=document.getElementById('zone-map-toggle');const setDock=open=>{dock.classList.toggle('open',open);toggle?.setAttribute('aria-expanded',String(open));if(toggle)toggle.textContent=open?'Close page map':'Open page map';};toggle?.addEventListener('click',()=>setDock(!dock.classList.contains('open')));document.addEventListener('keydown',event=>{if(event.key==='Escape')setDock(false);});dock.addEventListener('click',event=>{if(event.target.closest('a'))setDock(false);});
    if('IntersectionObserver' in window){const zoneObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;dock.querySelectorAll('a').forEach(link=>link.classList.toggle('active',link.dataset.zoneTarget===entry.target.id));entry.target.classList.add('zone-seen');}),{rootMargin:'-24% 0px -58%',threshold:.05});zones.forEach(({section})=>zoneObserver.observe(section));}
  }
}
document.querySelectorAll('code').forEach(code=>{const value=code.textContent.trim();if(!value||(!value.startsWith('/')&&!/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(value)))return;code.classList.add('copy-command');code.tabIndex=0;code.setAttribute('role','button');code.setAttribute('aria-label','Copy '+value);const copy=async()=>{try{await navigator.clipboard.writeText(value);showAppToast('Copied '+value);}catch{showAppToast('Select and copy: '+value);}};code.addEventListener('click',copy);code.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();copy();}});});
const scrollMeter=document.createElement('div');scrollMeter.className='site-scroll-meter';scrollMeter.setAttribute('aria-hidden','true');scrollMeter.innerHTML='<i></i>';document.body.append(scrollMeter);let meterTick=false;window.addEventListener('scroll',()=>{if(meterTick)return;meterTick=true;requestAnimationFrame(()=>{const max=Math.max(1,document.documentElement.scrollHeight-innerHeight),value=Math.min(100,scrollY/max*100);scrollMeter.firstElementChild.style.width=value+'%';meterTick=false;});},{passive:true});
document.querySelectorAll('[data-journal-toggle]').forEach(button=>{if(button.classList.contains('journal-toggle'))button.childNodes[0].textContent='QUEST LOG ';});

})();
