
(()=>{
  const body=document.body;
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
  if(isGuide&&!visited.includes(page)){visited.push(page);newly=true;localStorage.setItem(key,JSON.stringify(visited));}
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
  function setJournal(open){
    if(!journal||!scrim)return;
    journal.classList.toggle('open',open);scrim.classList.toggle('open',open);journal.setAttribute('aria-hidden',String(!open));
    document.querySelectorAll('[data-journal-toggle]').forEach(b=>b.setAttribute('aria-expanded',String(open)));
  }
  document.querySelectorAll('[data-journal-toggle]').forEach(b=>b.addEventListener('click',()=>setJournal(!journal.classList.contains('open'))));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setJournal(false);});
  const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}}),{threshold:.08});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
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

})();
