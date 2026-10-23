import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import * as G from '../assets/watch-game.mjs';

const base=process.env.HYNOE_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});
await mkdir('test-artifacts',{recursive:true});
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900}});
  await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  const old=G.fresh(Date.now()-600000);old.pick=2;old.crew=1;old.ore=500;old.total=1000;old.blocks=20;
  old.progress.bag.copper=3;old.progress.bag.coal=2;
  old.progress.crewDeck.cards.coalhand={stars:1,shards:0};old.progress.crewDeck.active=['coalhand'];
  await context.addInitScript(raw=>{if(!localStorage.getItem('hynoeOutpostV1'))localStorage.setItem('hynoeOutpostV1',raw);},JSON.stringify(old));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/watch.html');
  await page.waitForSelector('#vein-11');
  assert.equal(await page.locator('#outpost-planner').count(),1,'pinned-goal panel should exist');
  assert.equal(await page.locator('#offline-recap').isVisible(),true,'returning player sees credited earnings');
  assert.match(await page.locator('#recap-details').innerText(),/ore/i);
  await page.locator('#dismiss-offline-recap').click();
  assert.equal(await page.locator('#offline-recap').isVisible(),false);
  await page.locator('#show-offline-recap').click();
  assert.equal(await page.locator('#offline-recap').isVisible(),true);
  await page.locator('#pinned-goal-select').selectOption('gear:chisel:1');
  await page.locator('#pin-goal').click();
  assert.match(await page.locator('#pinned-goal-title').innerText(),/chisel/i);
  assert.match(await page.locator('#pinned-goal-requirements').innerText(),/9.*copper|copper.*9/i);
  await page.locator('#pinned-goal-action').click();
  assert.equal(await page.locator('#research').isVisible(),true,'goal shortcut opens the actual destination');
  await page.locator('#tab-crew').click();
  await page.locator('#preset-mining-save').click();
  assert.match(await page.locator('#preset-mining-team').innerText(),/Coalhand/);
  assert.match(await page.locator('#preset-mining-bonus').innerText(),/strike|idle/i);
  const remove=page.locator('.crew-card.equipped button').filter({hasText:'Remove'});await remove.click();
  await page.locator('#preset-mining-apply').click();
  assert.match(await page.locator('#active-lineup').innerText(),/Coalhand/);
  for(const slot of ['caves','dispatch']){
    await page.locator('#preset-'+slot+'-save').click();
    await page.locator('#preset-'+slot+'-apply').click();
    assert.match(await page.locator('#preset-'+slot+'-team').innerText(),/Coalhand/);
  }
  await page.reload();await page.waitForSelector('#vein-11');
  assert.match(await page.locator('#pinned-goal-title').innerText(),/chisel/i);
  await page.locator('#tab-crew').click();
  assert.match(await page.locator('#preset-mining-team').innerText(),/Coalhand/);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('hynoeOutpostV1')));
  assert.equal(saved.pick,2);assert.equal(saved.blocks,20);assert.equal(saved.progress.bag.copper,3);
  assert.deepEqual(saved.progress.crewDeck.active,['coalhand']);
  assert.match(await page.locator('#save-status').innerText(),/saved on this device at/i);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'planner must not overflow');
  assert.deepEqual(errors,[]);
  await page.screenshot({path:`test-artifacts/outpost-planner-${width}.png`,fullPage:false});
  await context.close();
 }
 const completedContext=await browser.newContext();
 await completedContext.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
 const prior=G.fresh(Date.now());prior.pick=2;prior.ore=1000;prior.total=200000;prior.run=200000;
 await completedContext.addInitScript(raw=>{if(!localStorage.getItem('hynoeOutpostV1'))localStorage.setItem('hynoeOutpostV1',raw);},JSON.stringify(prior));
 const completed=await completedContext.newPage();await completed.goto(base+'/watch.html');await completed.waitForSelector('#vein-11');
 await completed.locator('#pinned-goal-select').selectOption('upgrade:pick:3');await completed.locator('#pin-goal').click();
 await completed.locator('#pinned-goal-action').click();await completed.locator('#buy-pick').click();
 assert.match(await completed.locator('#pinned-goal-title').innerText(),/✓/);
 await completed.locator('#tab-journal').click();await completed.locator('#ascend').click();
 await completed.locator('#confirm-ascend button[value="confirm"]').click();
 assert.match(await completed.locator('#pinned-goal-title').innerText(),/✓/,'a completed pinned upgrade must stay completed after Legacy');
 await completed.reload();await completed.waitForSelector('#vein-11');
 assert.match(await completed.locator('#pinned-goal-title').innerText(),/✓/);
 await completedContext.close();
 const blockedContext=await browser.newContext();
 await blockedContext.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
 const stored=JSON.stringify(G.fresh(Date.now()));
 await blockedContext.addInitScript(raw=>{localStorage.setItem('hynoeOutpostV1',raw);Storage.prototype.setItem=function(){throw new DOMException('Storage is full','QuotaExceededError');};},stored);
 const blocked=await blockedContext.newPage(),blockedErrors=[];blocked.on('pageerror',error=>blockedErrors.push(error.message));
 await blocked.goto(base+'/watch.html');await blocked.waitForSelector('#vein-11');
 assert.match(await blocked.locator('#save-status').innerText(),/cannot be saved/i);
 await blocked.locator('#pin-goal').click();
 assert.match(await blocked.locator('#planner-storage').innerText(),/could not save/i);
 await blocked.locator('#vein-0').click();
 assert.equal(await blocked.evaluate(()=>localStorage.getItem('hynoeOutpostV1')),stored,'failed writes must retain the prior save');
 assert.deepEqual(blockedErrors,[]);
 await blockedContext.close();
 const legacyContext=await browser.newContext();
 await legacyContext.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
 const legacyState=G.fresh(Date.now()-600000);legacyState.pick=3;legacyState.crew=1;legacyState.ore=200;legacyState.total=1000;
 const legacyRaw=JSON.stringify(legacyState);
 await legacyContext.addInitScript(raw=>{localStorage.setItem('hynoeDeepDeeperV1',raw);Storage.prototype.setItem=function(){throw new DOMException('Storage is full','QuotaExceededError');};},legacyRaw);
 const legacy=await legacyContext.newPage();await legacy.goto(base+'/watch.html');await legacy.waitForSelector('#vein-11');
 await legacy.locator('#tab-upgrades').click();
 assert.match(await legacy.locator('#owned-pick').innerText(),/^3 owned$/,'storage failure must retain restored legacy gear in the session');
 assert.equal(await legacy.locator('#offline-recap').isVisible(),true);
 assert.match(await legacy.locator('#save-status').innerText(),/cannot be saved/i);
 assert.equal(await legacy.evaluate(()=>localStorage.getItem('hynoeDeepDeeperV1')),legacyRaw);
 assert.equal(await legacy.evaluate(()=>localStorage.getItem('hynoeOutpostV1')),null);
 await legacyContext.close();
 for(const width of [390,1440])for(const away of [0,120000]){
  const clock=Date.now(),guideState=G.fresh(clock-away);guideState.ore=100;guideState.total=100;guideState.crew=1;
  guideState.progress.crewDeck.cards.coalhand={stars:1,shards:0};guideState.progress.crewDeck.active=['coalhand'];
  const context=await browser.newContext({viewport:{width,height:844},hasTouch:width<600,isMobile:width<600});
  await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  await context.addInitScript(({raw,clock})=>{Date.now=()=>clock;localStorage.setItem('hynoeOutpostV1',raw);},{raw:JSON.stringify(guideState),clock});
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/watch.html');await page.waitForFunction(()=>document.querySelector('#save-status')?.textContent.includes('Saved on this device at'));
  const stored=await page.evaluate(()=>({game:localStorage.getItem('hynoeOutpostV1'),prefs:localStorage.getItem('hynoeOutpostPlannerV1')}));
  const originalRecap=await page.locator('#recap-details').innerText();
  if(away)await page.locator('#dismiss-offline-recap').click();
  for(const [label,target] of [['Open pinned goals','pinned-goal-select'],['Open crew presets','preset-mining-save'],['Open offline earnings','dismiss-offline-recap']]){
   await page.locator('#open-help').click();const dialog=page.locator('#how-to-play'),button=dialog.getByRole('button',{name:label,exact:true});
   assert.equal(await button.count(),1,'guide shortcut should exist: '+label);
   if(width<600)await button.tap();else{await button.focus();await button.press('Enter');}
   assert.equal(await dialog.isVisible(),false,label+' closes the guide');
   await page.waitForFunction(id=>document.activeElement?.id===id,target,{timeout:3000});
   const bounds=await page.locator('#'+target).evaluate(element=>{const r=element.getBoundingClientRect(),nav=document.querySelector('[data-site-navigation]').getBoundingClientRect();return {top:r.top,bottom:r.bottom,header:nav.bottom,height:innerHeight};});
   assert.ok(bounds.top>=bounds.header&&bounds.bottom<=bounds.height,label+' destination must be clear of sticky navigation');
   if(target==='preset-mining-save')assert.equal(await page.locator('#tab-crew').getAttribute('aria-selected'),'true');
   if(target==='dismiss-offline-recap'){
    assert.equal(await page.locator('#offline-recap').isVisible(),true);
    const text=await page.locator('#recap-details').innerText();
    if(away)assert.equal(text,originalRecap,'reopening keeps the same already-credited report');
    else assert.match(text,/reopen.*minute|no.*summary/i,'fresh players get a truthful empty state');
    await page.locator('#dismiss-offline-recap').click();assert.equal(await page.locator('#offline-recap').isVisible(),false);
    assert.equal(await page.evaluate(()=>document.activeElement?.id),away?'show-offline-recap':'open-help');
   }
   assert.deepEqual(await page.evaluate(()=>({game:localStorage.getItem('hynoeOutpostV1'),prefs:localStorage.getItem('hynoeOutpostPlannerV1')})),stored,'guide links must not change progress or settings');
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('Outpost planner browser checks passed: pin/source, preset save/apply/reload, recap, progress preservation, desktop and phone.');
}finally{await browser.close();}
