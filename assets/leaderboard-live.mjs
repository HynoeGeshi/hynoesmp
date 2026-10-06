/*! Copyright © 2026 Hynoe. All rights reserved. See /COPYRIGHT.md. */
export const OPT_IN_KEY='hynoeLegendOptInV1';
export const PUBLIC_BOARD_PATH='/v1/leaderboard';
export const SCORE_PATH='/v1/score';

export function readOptIn(storage=globalThis.localStorage){
  try{return storage?.getItem(OPT_IN_KEY)==='yes';}catch{return false;}
}

export function writeOptIn(enabled,storage=globalThis.localStorage){
  try{
    if(enabled)storage?.setItem(OPT_IN_KEY,'yes');
    else storage?.removeItem(OPT_IN_KEY);
  }catch{}
  return !!enabled;
}

export function scoreRequestOptions(payload){
  return {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)};
}

export function mountLeaderboardConsent({optedIn=false,onChange=()=>{}}={}){
  const notice=document.querySelector('.leaderboard-privacy');
  if(!notice)return null;
  notice.classList.add('live');
  notice.replaceChildren();

  const title=document.createElement('strong');
  title.textContent='GLOBAL HALL LIVE';
  const copy=document.createElement('p');
  copy.append('Everyone can view the site-wide Hall of Legends. Publishing your own score is optional and sends a random device ID, your callsign, and bounded gameplay metrics. ');
  const privacy=document.createElement('a');
  privacy.href='privacy.html';
  privacy.textContent='Privacy';
  const separator=document.createTextNode(' · ');
  const deletion=document.createElement('a');
  deletion.href='data-deletion.html';
  deletion.textContent='Data deletion';
  copy.append(privacy,separator,deletion);

  const label=document.createElement('label');
  label.className='leaderboard-consent';
  const input=document.createElement('input');
  input.type='checkbox';
  input.id='leader-opt-in';
  input.checked=!!optedIn;
  input.setAttribute('aria-describedby','leader-consent-copy');
  const text=document.createElement('span');
  const lead=document.createElement('b');
  lead.textContent='Publish my score to the global board';
  const detail=document.createElement('small');
  detail.id='leader-consent-copy';
  detail.textContent='Off by default. Turn this off anytime to stop future score uploads; use Data deletion for an existing server-side record.';
  text.append(lead,detail);
  label.append(input,text);

  input.addEventListener('change',()=>onChange(input.checked));
  notice.append(title,copy,label);
  return input;
}
