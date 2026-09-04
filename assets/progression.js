
(()=>{
 const buttons=[...document.querySelectorAll('.gear-crystal')],title=document.getElementById('gear-title'),phase=document.getElementById('gear-phase'),desc=document.getElementById('gear-desc');
 buttons.forEach(b=>b.addEventListener('click',()=>{buttons.forEach(x=>x.classList.remove('selected'));b.classList.add('selected');title.textContent=b.dataset.tier;phase.textContent=(b.dataset.phase||'').toUpperCase();desc.textContent=b.dataset.desc||'';}));
})();

(()=>{
  const tabs=[...document.querySelectorAll('[data-age-tab]')];
  const panels=[...document.querySelectorAll('[data-age-panel]')];
  if(!tabs.length)return;
  function show(name){
    tabs.forEach(t=>t.classList.toggle('active',t.dataset.ageTab===name));
    panels.forEach(p=>p.classList.toggle('active',p.dataset.agePanel===name));
  }
  tabs.forEach(t=>t.addEventListener('click',()=>show(t.dataset.ageTab)));
})();
