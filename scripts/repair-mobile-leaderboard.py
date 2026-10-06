from pathlib import Path
import re


def replace_once(text, old, new, label):
    count=text.count(old)
    if count!=1:
        raise SystemExit(f'{label}: expected exactly one match, found {count}')
    return text.replace(old,new,1)

# 1) Force a fresh mobile bundle and load the leaderboard privacy helper/styles.
p=Path('watch.html'); text=p.read_text()
old='<link rel="stylesheet" href="assets/watch.css?v=20261005c"><link rel="stylesheet" href="assets/watch-mobile.css?v=20261005a"><script type="module" src="assets/watch.mjs?v=20261005d"></script><script type="module" src="assets/watch-mobile.mjs?v=20261005a"></script>'
new='<link rel="stylesheet" href="assets/watch.css?v=20261006b"><link rel="stylesheet" href="assets/watch-mobile.css?v=20261006b"><link rel="stylesheet" href="assets/leaderboard-live.css?v=20261006b"><script type="module" src="assets/leaderboard-live.mjs?v=20261006b"></script><script type="module" src="assets/watch.mjs?v=20261006b"></script><script type="module" src="assets/watch-mobile.mjs?v=20261006b"></script>'
text=replace_once(text,old,new,'watch asset versions')
old='<div class="notice leaderboard-privacy"><strong>GLOBAL SYNC PAUSED</strong><p>Your local Legend score still works. External leaderboard uploads are paused while Hynoe finishes worldwide privacy and deletion controls. <a href="privacy.html">Privacy</a> · <a href="data-deletion.html">Data deletion</a></p></div>'
new='<div class="notice leaderboard-privacy"><strong>GLOBAL HALL CONNECTING</strong><p>Site-wide rankings are live. Publishing your own score is optional and off by default. <a href="privacy.html">Privacy</a> · <a href="data-deletion.html">Data deletion</a></p></div>'
text=replace_once(text,old,new,'leaderboard privacy notice')
text=text.replace('<b id="podium-name-2">LOCAL</b>','<b id="podium-name-2">HALL OF</b>',1)
text=text.replace('<b id="podium-name-1">PRIVACY HOLD</b>','<b id="podium-name-1">CONNECTING</b>',1)
text=text.replace('<b id="podium-name-3">NO UPLOADS</b>','<b id="podium-name-3">LEGENDS</b>',1)
text=text.replace('GLOBAL OUTPOST LADDER · GLOBAL SYNC PAUSED','GLOBAL OUTPOST LADDER · LIVE RANKINGS',1)
text=text.replace('LOCAL ONLY · PRIVACY HOLD','CONNECTING',2)
text=text.replace('Your device keeps a local player ID for Legend scoring. Global uploads are paused; no save-file imports.','Your device keeps a random local player ID for Legend scoring. You decide whether to publish your score to the global board.',1)
text=text.replace('Global sync is temporarily paused for privacy/deletion work. Your local Legend score and tiers continue normally.','Live site-wide rankings. Your own score stays local until you explicitly opt in to publish it.',1)
p.write_text(text)

# 2) Explicit mobile artwork guard. It intentionally lives in the already-loaded phone layer.
p=Path('assets/watch-mobile.css'); text=p.read_text()
guard='''\n/* Production mobile artwork guard: never let a stale/inherited rule collapse mine SVGs. */\n@media(max-width:899px){\n  .vein .ore-crystal{display:block!important;visibility:visible!important;opacity:1!important;flex:0 0 auto}\n  .vein .ore-crystal svg{display:block!important;width:100%!important;height:100%!important;visibility:visible!important;opacity:1!important}\n}\n'''
if 'Production mobile artwork guard' not in text:
    text=text.rstrip()+guard
p.write_text(text)

# 3) Turn the board back on for reads, but keep score publication opt-in.
p=Path('assets/watch.mjs'); text=p.read_text()
text=replace_once(text,"import * as S from './watch-session.mjs?v=20261005a';","import * as S from './watch-session.mjs?v=20261005a';\nimport * as L from './leaderboard-live.mjs?v=20261006b';",'leaderboard helper import')
old="const GLOBAL_BOARD_ENABLED=false;let leaderboardEndpoint='',globalBoard=null,leaderboardState=GLOBAL_BOARD_ENABLED?'CONNECTING':'LOCAL ONLY · PRIVACY HOLD',leaderboardInFlight=false,leaderboardSyncTimer,lastSubmittedKey='';"
new="const GLOBAL_BOARD_ENABLED=true;let leaderboardOptedIn=L.readOptIn(),leaderboardEndpoint='',globalBoard=null,leaderboardState='CONNECTING',leaderboardInFlight=false,leaderboardSyncTimer,lastSubmittedKey='';"
text=replace_once(text,old,new,'leaderboard enable state')
anchor='function expeditionBlockers(minutes)'
insert="L.mountLeaderboardConsent({optedIn:leaderboardOptedIn,onChange:enabled=>{leaderboardOptedIn=L.writeOptIn(enabled);lastSubmittedKey='';syncLeaderboard(enabled);toast(enabled?'Global ranking enabled. Your score will publish to Hall of Legends.':'Global ranking disabled. Future score uploads are stopped.');}});\n"
text=replace_once(text,anchor,insert+anchor,'leaderboard consent mount')
pattern=r"async function syncLeaderboard\(force=false\)\{.*?\}\nfunction queueLeaderboardSync\(\)\{.*?\}\nasync function connectLeaderboard\(\)\{.*?\}\nfunction save\(\)"
replacement="""async function syncLeaderboard(force=false){
 if(!GLOBAL_BOARD_ENABLED)return;if(!leaderboardEndpoint||leaderboardInFlight)return;leaderboardInFlight=true;leaderboardState=globalBoard?'UPDATING':'CONNECTING';renderLeaderboard();const payload=leaderboardPayload(),key=JSON.stringify(payload);try{let data;if(leaderboardOptedIn&&(force||key!==lastSubmittedKey)){try{data=await leaderboardFetch(L.SCORE_PATH,L.scoreRequestOptions(payload));lastSubmittedKey=key;}catch(error){if(error.status!==429)throw error;data=await leaderboardFetch(L.PUBLIC_BOARD_PATH);}}else data=await leaderboardFetch(L.PUBLIC_BOARD_PATH);acceptGlobalBoard(data);}catch{leaderboardState=globalBoard?'LIVE DATA DELAYED':'OFFLINE · RETRYING';renderLeaderboard();}finally{leaderboardInFlight=false;}}
function queueLeaderboardSync(){if(!GLOBAL_BOARD_ENABLED||!leaderboardOptedIn)return;if(!leaderboardEndpoint||leaderboardSyncTimer||leaderboardKey()===lastSubmittedKey)return;leaderboardSyncTimer=setTimeout(()=>{leaderboardSyncTimer=null;syncLeaderboard();},1500);}
async function connectLeaderboard(){if(!GLOBAL_BOARD_ENABLED)return;try{const config=await fetch('data/leaderboard-config.json',{cache:'no-store'}).then(r=>r.json()),url=new URL(config.endpoint);if(url.protocol!=='https:')throw Error();leaderboardEndpoint=url.href.replace(/\\/$/,'');await syncLeaderboard(false);}catch{leaderboardState='OFFLINE · RETRYING';renderLeaderboard();}}
function save()"""
text,count=re.subn(pattern,replacement,text,count=1,flags=re.S)
if count!=1: raise SystemExit(f'leaderboard sync functions: expected 1 replacement, found {count}')
old="$('leader-save').onclick=()=>{legendName=$('leader-name').value.replace(/[^A-Za-z0-9 _-]/g,'').trim().slice(0,18)||('MINER-'+playerId.slice(0,4).toUpperCase());try{localStorage.setItem('hynoeLegendName',legendName);}catch{}$('leader-name').value=legendName;lastSubmittedKey='';renderLeaderboard();syncLeaderboard(true);toast('Global callsign saved: '+legendName);};"
new="$('leader-save').onclick=()=>{legendName=$('leader-name').value.replace(/[^A-Za-z0-9 _-]/g,'').trim().slice(0,18)||('MINER-'+playerId.slice(0,4).toUpperCase());try{localStorage.setItem('hynoeLegendName',legendName);}catch{}$('leader-name').value=legendName;lastSubmittedKey='';renderLeaderboard();syncLeaderboard(leaderboardOptedIn);toast((leaderboardOptedIn?'Global':'Local')+' callsign saved: '+legendName);};"
text=replace_once(text,old,new,'leader save handler')
text=text.replace("'Local only · '+tier.name+' · '+fmt(bestScore)","(leaderboardEndpoint?'Unranked · ':'Offline · ')+tier.name+' · '+fmt(bestScore)",1)
text=text.replace("['PRIVACY HOLD','LOCAL','NO UPLOADS']","['CONNECTING','HALL OF','LEGENDS']",1)
p.write_text(text)

# 4) Browser test must prove actual geometry, not merely that the SVG exists in source.
p=Path('tests/browser-mobile.mjs'); text=p.read_text()
anchor="  const minVeinHeight=await page.locator('#vein-0').evaluate(el=>el.getBoundingClientRect().height);\n  assert.ok(minVeinHeight>=88,`${label}: vein target only ${minVeinHeight}px tall`);\n"
addition="""  const miningArtwork=await page.locator('#vein-0 .ore-crystal svg').evaluate(el=>{const box=el.getBoundingClientRect(),style=getComputedStyle(el),face=el.querySelector('.gem-face');return {width:box.width,height:box.height,display:style.display,visibility:style.visibility,opacity:Number(style.opacity),fill:face?getComputedStyle(face).fill:''};});
  assert.ok(miningArtwork.width>=40&&miningArtwork.height>=30,`${label}: mining artwork has no rendered geometry (${miningArtwork.width}x${miningArtwork.height})`);
  assert.notEqual(miningArtwork.display,'none',`${label}: mining artwork is display:none`);
  assert.notEqual(miningArtwork.visibility,'hidden',`${label}: mining artwork is hidden`);
  assert.ok(miningArtwork.opacity>0,`${label}: mining artwork is transparent`);
  assert.ok(miningArtwork.fill&&miningArtwork.fill!=='none',`${label}: mining artwork gem face has no fill`);
"""
text=replace_once(text,anchor,anchor+addition,'browser artwork assertion')
p.write_text(text)

# 5) Keep legal copy truthful: public board reads are live; publishing is optional.
p=Path('privacy.html'); text=p.read_text()
text=replace_once(text,'<div class="notice"><strong>Current account status:</strong> Cloud accounts and cloud saves are not live. Hynoe Outpost can be played locally without giving Hynoe an email address. The external global leaderboard is on a privacy hold while worldwide access, deletion, export, age, and security controls are completed.</div>','<div class="notice"><strong>Current account status:</strong> Cloud accounts and cloud saves are not live. Hynoe Outpost can be played locally without giving Hynoe an email address. The site-wide Hall of Legends can be viewed by everyone; publishing your own score is optional and off by default.</div>','privacy status')
old='<div class="legal-card"><h3>Global leaderboard</h3><p>The global leaderboard is currently paused for privacy and deletion work. Current Hynoe Outpost builds keep Legend scoring local and do not need to upload the local player ID, callsign, or gameplay metrics to the global board while the privacy hold is active.</p><p>Older versions of the site may have submitted a random player ID, callsign, and bounded gameplay metrics to the leaderboard service before this hold. If you want Hynoe to review or delete legacy leaderboard data associated with you, use the process on <a href="data-deletion.html">Data Deletion</a>.</p></div>'
new='<div class="legal-card"><h3>Global leaderboard</h3><p>The site-wide Hall of Legends can load public ranking data from Hynoe\'s leaderboard service. Merely viewing the board does not upload your Hynoe Outpost save or gameplay metrics. Publishing your own ranking is optional and off by default.</p><p>If you turn on <strong>Publish my score</strong>, the site may send a random local player ID, your chosen callsign, and bounded gameplay metrics used to calculate/rank your Legend score. You can turn publication off to stop future score uploads. To request review or deletion of an existing leaderboard record, use <a href="data-deletion.html">Data Deletion</a>. Standard technical request information may still be processed by the service provider when the public board is loaded.</p></div>'
text=replace_once(text,old,new,'privacy leaderboard section')
p.write_text(text)

p=Path('data-deletion.html'); text=p.read_text()
old='<h2>3. Legacy leaderboard records</h2><p>The current build places global leaderboard uploads on a privacy hold. Older Hynoe Outpost builds may have submitted a random player identifier, callsign, and bounded gameplay metrics to the legacy leaderboard service before that hold.</p><p>If you want Hynoe to review whether a legacy leaderboard record is associated with you, or request deletion where Hynoe can identify and control that record, use the official Hynoe Discord linked from <a href="index.html">hynoesmp.com</a> and ask for a <strong>private</strong> conversation with the Hynoe owner or moderation team.</p>'
new='<h2>3. Global leaderboard records</h2><p>The Hall of Legends is viewable by everyone. Publishing your own score is optional and off by default. If you opt in, Hynoe may store a random player identifier, your callsign, and bounded gameplay metrics used for the ranking. Turning publication off stops future score uploads but does not automatically erase an existing server-side record.</p><p>If you want Hynoe to review whether a leaderboard record is associated with you, or request deletion where Hynoe can identify and control that record, use the official Hynoe Discord linked from <a href="index.html">hynoesmp.com</a> and ask for a <strong>private</strong> conversation with the Hynoe owner or moderation team.</p>'
text=replace_once(text,old,new,'data deletion leaderboard section')
p.write_text(text)

print('repair patch applied')
