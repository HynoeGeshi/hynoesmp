/*! Copyright © 2026 Hynoe. All rights reserved. See /COPYRIGHT.md. */
(()=>{
  const header=document.querySelector('.world-hud,.topbar');
  if(!header)return;
  const update=()=>document.documentElement.style.setProperty('--site-header-height',`${Math.ceil(header.getBoundingClientRect().height)}px`);
  update();
  if('ResizeObserver' in window)new ResizeObserver(update).observe(header);
  else window.addEventListener('resize',update,{passive:true});
  // Some shells intentionally have no guide script; keep their current-page
  // marker identical without changing any game or account state.
  const page=location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('[data-site-navigation] a').forEach(link=>{
    const current=new URL(link.href,location.href).pathname.split('/').pop()===page;
    link.classList.toggle('active',current);
    if(current)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  });
})();
