from pathlib import Path
import re

watch_html_path = Path('watch.html')
index_path = Path('index.html')
watch_js_path = Path('assets/watch.mjs')
mobile_css_path = Path('assets/watch-mobile.css')
mobile_js_path = Path('assets/watch-mobile.mjs')

watch_html = watch_html_path.read_text()
index_html = index_path.read_text()
watch_js = watch_js_path.read_text()

# Load a dedicated mobile layer after the existing Watch & Play assets.
css_anchor = '<link rel="stylesheet" href="assets/watch.css?v=20261005c">'
css_link = '<link rel="stylesheet" href="assets/watch-mobile.css?v=20261005a">'
if css_link not in watch_html:
    if css_anchor not in watch_html:
        raise SystemExit('watch.css anchor missing')
    watch_html = watch_html.replace(css_anchor, css_anchor + css_link, 1)

js_anchor = '<script type="module" src="assets/watch.mjs?v=20261005d"></script>'
js_link = '<script type="module" src="assets/watch-mobile.mjs?v=20261005a"></script>'
if js_link not in watch_html:
    if js_anchor not in watch_html:
        raise SystemExit('watch.mjs anchor missing')
    watch_html = watch_html.replace(js_anchor, js_anchor + js_link, 1)

# Retire the risky old visible game name while leaving gameplay terminology intact.
old_heading = '<h1>DEEP <em>&</em> DEEPER</h1>'
if old_heading in watch_html:
    watch_html = watch_html.replace(old_heading, '<h1>HYNOE OUTPOST</h1>', 1)
elif '<h1>HYNOE OUTPOST</h1>' not in watch_html:
    raise SystemExit('game heading anchor missing')

old_home_brand = '<b>DEEP<br>&amp; DEEPER</b>'
if old_home_brand in index_html:
    index_html = index_html.replace(old_home_brand, '<b>HYNOE<br>OUTPOST</b>', 1)
elif 'HYNOE<br>OUTPOST' not in index_html and 'Hynoe Outpost' not in index_html:
    raise SystemExit('homepage game branding anchor missing')

# Migrate local saves without deleting the legacy key.
key_pattern = r"const \$=id=>document\.getElementById\(id\),KEY='hynoeDeepDeeperV1',fmt="
key_replacement = "const $=id=>document.getElementById(id),KEY='hynoeOutpostV1',LEGACY_KEY='hynoeDeepDeeperV1',fmt="
watch_js, changed = re.subn(key_pattern, key_replacement, watch_js, count=1)
if changed != 1 and "KEY='hynoeOutpostV1',LEGACY_KEY='hynoeDeepDeeperV1'" not in watch_js:
    raise SystemExit('save-key anchor missing')

old_restore = "let state;try{state=G.restore(localStorage.getItem(KEY));}catch{state=G.fresh();}"
new_restore = "let state;try{const current=localStorage.getItem(KEY),legacy=current?null:localStorage.getItem(LEGACY_KEY);state=G.restore(current||legacy);if(!current&&legacy)localStorage.setItem(KEY,JSON.stringify(state));}catch{state=G.fresh();}"
if old_restore in watch_js:
    watch_js = watch_js.replace(old_restore, new_restore, 1)
elif new_restore not in watch_js:
    raise SystemExit('save restore anchor missing')

mobile_css = r'''/*! Copyright © 2026 Hynoe. All rights reserved. See /COPYRIGHT.md. */
/* Hynoe Outpost mobile interaction layer */
.game button,.site-pages a,.tabs button,.outpost-jumps a{touch-action:manipulation}
.tabs{scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
.tabs button{scroll-snap-align:start;flex:0 0 auto}

@media(max-width:899px){
  .game>.panel-head{align-items:flex-start;flex-wrap:wrap}
  .game-head-actions{display:flex;flex-wrap:wrap;gap:6px;width:100%}
  .game-head-actions button{min-height:44px}
  .stats{grid-template-columns:repeat(2,minmax(0,1fr))}
  .mining-hud{flex-wrap:wrap}
  .field-order{align-items:stretch}
  .operation-routes,.leader-categories,.crew-overview,.command-dashboard,.station-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .research-row{align-items:stretch}
  .tabs{overflow-x:auto;white-space:nowrap;overscroll-behavior-x:contain}
  .tabs button{min-height:44px}
  .video.docked iframe{left:auto;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));max-width:calc(100vw - 24px)}
  .dock-toggle{left:auto;right:12px;bottom:calc(117px + env(safe-area-inset-bottom));min-height:36px}
}

@media(max-width:479px){
  main{padding-inline:8px}
  .topbar{align-items:flex-start;gap:8px}
  .topbar nav{overflow-x:auto;max-width:58vw;padding-bottom:4px}
  .topbar nav a{min-height:44px;display:flex;align-items:center}
  .site-pages{scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;padding-inline:8px}
  .site-pages a{scroll-snap-align:start;min-height:44px;display:flex;align-items:center}
  .outpost-jumps{overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch}
  .outpost-jumps a{flex:0 0 auto;min-height:44px}
  .game>.panel-head{padding:15px 12px 8px}
  .game h1{font-size:32px;line-height:1}
  .game-note{margin-inline:12px}
  .stats{grid-template-columns:repeat(2,minmax(0,1fr));padding-inline:10px;gap:6px}
  .stats div{min-width:0;padding:8px}
  .stats strong{font-size:24px;overflow-wrap:anywhere}
  .campaign-strip{align-items:flex-start;flex-direction:column;padding-inline:12px}
  .campaign-strip button{width:100%;min-height:44px}
  .next-goal{padding-inline:12px}
  .mine-purpose{grid-template-columns:1fr}
  .mine-scene.mine-v2{padding:58px 10px 14px;min-height:620px}
  .vein-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
  .vein{min-height:96px;padding:8px 5px;touch-action:manipulation}
  .vein .ore-crystal{width:78px;height:52px}
  .vein strong{font-size:11px}
  .vein small{font-size:9px;line-height:1.35}
  .mine-caption{inset:14px 12px auto;gap:6px}
  .mine-caption #biome{font-size:15px}
  .mine-caption #event{max-width:48%;text-align:right}
  .mining-hud{gap:6px;justify-content:flex-start}
  .mining-hud span{flex:1 1 42%}
  .mining-hud button{min-height:40px}
  .field-order{margin-inline:10px;flex-direction:column}
  .field-order button{width:100%;min-height:44px}
  .guardian-card{margin-inline:10px;flex-direction:column;align-items:stretch}
  .guardian-actions{max-width:none;display:grid;grid-template-columns:1fr;gap:7px}
  .guardian-actions button{max-width:none;width:100%;min-height:44px}
  .realm-route{margin-inline:10px;grid-template-columns:repeat(2,minmax(0,1fr))}
  .tabs{padding-inline:6px}
  .tabs button{padding:10px 12px;min-height:44px}
  .tab-content{padding-inline:12px}
  .operation-routes,.leader-categories,.crew-overview,.command-dashboard,.station-grid,.chapter-goals,.sector-list,.style-list{grid-template-columns:1fr}
  .research-row{flex-direction:column}
  .research-row button{width:100%;min-height:44px}
  .run-actions{grid-template-columns:1fr}
  .run-actions button{min-height:48px}
  .leader-profile{grid-template-columns:1fr}
  .callsign-edit{flex-direction:column}
  .callsign-edit button{min-height:44px}
  .savebar{align-items:flex-start;flex-direction:column;padding-inline:12px}
  .video.docked iframe{width:176px;height:99px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom))}
  .dock-toggle{right:10px;bottom:calc(113px + env(safe-area-inset-bottom));min-height:36px}
  .toast{bottom:calc(14px + env(safe-area-inset-bottom));width:calc(100vw - 24px)}
}

@media(min-width:480px) and (max-width:899px){
  .vein-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
  .vein{min-height:92px;touch-action:manipulation}
  .video.docked iframe{width:224px;height:126px}
  .dock-toggle{bottom:calc(142px + env(safe-area-inset-bottom))}
}

@media(max-height:500px) and (orientation:landscape) and (max-width:899px){
  .mine-scene.mine-v2{min-height:500px;padding-top:52px}
  .mine-v2:before,.mine-v2:after,.cave-light,.mine-rails{opacity:.5}
  .game-note,.outpost-jumps small{display:none}
  .video.docked iframe{width:176px;height:99px}
}

@media(prefers-reduced-motion:reduce){
  .tabs,.site-pages{scroll-behavior:auto}
  .vein,.video.docked iframe{transition:none!important}
}
'''

mobile_js = r'''/*! Copyright © 2026 Hynoe. All rights reserved. See /COPYRIGHT.md. */
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
'''

watch_html_path.write_text(watch_html)
index_path.write_text(index_html)
watch_js_path.write_text(watch_js)
mobile_css_path.write_text(mobile_css)
mobile_js_path.write_text(mobile_js)

# Fail loudly if an anchor or intended invariant did not land.
assert 'assets/watch-mobile.css' in watch_html_path.read_text()
assert 'assets/watch-mobile.mjs' in watch_html_path.read_text()
assert '<h1>HYNOE OUTPOST</h1>' in watch_html_path.read_text()
assert 'HYNOE<br>OUTPOST' in index_path.read_text()
assert "KEY='hynoeOutpostV1',LEGACY_KEY='hynoeDeepDeeperV1'" in watch_js_path.read_text()
assert 'grid-template-columns:repeat(2,minmax(0,1fr))' in mobile_css_path.read_text()
assert 'grid-template-columns:repeat(3,minmax(0,1fr))' in mobile_css_path.read_text()
assert "event.pointerType==='touch'||event.pointerType==='pen'" in mobile_js_path.read_text()
