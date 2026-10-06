/*! Copyright © 2026 Hynoe. All rights reserved. See /COPYRIGHT.md. */
import {recoveryResult} from './save-recovery.mjs?v=20261005a';

if(recoveryResult.recovered){
  try{
    const key='hynoeSaveRecoveryReloadedV1';
    if(sessionStorage.getItem(key)!=='1'){
      sessionStorage.setItem(key,'1');
      location.reload();
    }
  }catch{}
}

// Hynoe Outpost touch input bridge: one touch/pen activation = one mine.
const SUPPRESS_MS=650;

function bindVein(button){
  if(button.dataset.pointerMining==='bound')return;
  const original=button.onclick;
  if(typeof original!=='function')return;
  button.dataset.pointerMining='bound';
  let lastPointerActivation=-Infinity;

  button.onclick=event=>{
    if(event?.detail===0){original.call(button,event);return;}
    if(performance.now()-lastPointerActivation<SUPPRESS_MS)return;
    original.call(button,event);
  };

  button.addEventListener('pointerup',event=>{
    if(!event.isPrimary)return;
    if(!(event.pointerType==='touch'||event.pointerType==='pen'))return;
    event.preventDefault();
    lastPointerActivation=performance.now();
    original.call(button,event);
  },{passive:false});
}

function bindVeins(){document.querySelectorAll('.vein').forEach(bindVein);}
bindVeins();
const grid=document.getElementById('vein-grid');
if(grid)new MutationObserver(bindVeins).observe(grid,{childList:true});
