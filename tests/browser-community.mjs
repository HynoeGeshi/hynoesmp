import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,webkit} from 'playwright';

const base=process.env.HYNOE_BASE_URL||'http://127.0.0.1:4173';
const engine=process.env.COMMUNITY_ENGINE||'chromium';
const browserType=engine==='webkit'?webkit:chromium;
const browser=await browserType.launch({headless:true});
fs.mkdirSync('test-artifacts',{recursive:true});

async function verifyCommunity({width,height,isMobile,hasTouch,label}){
 const context=await browser.newContext({viewport:{width,height},isMobile,hasTouch});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 try{
  await page.goto(`${base}/economy.html?community=${Date.now()}-${width}`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.community-launcher');
  assert.equal(await page.locator('.community-panel').isHidden(),true,`${label}: panel auto-opened`);
  const closed=await page.evaluate(()=>({rootPointer:getComputedStyle(document.querySelector('.community-root')).pointerEvents,scrollWidth:document.documentElement.scrollWidth,innerWidth}));
  assert.equal(closed.rootPointer,'none',`${label}: closed root intercepts pointers`);
  assert.ok(closed.scrollWidth<=closed.innerWidth+1,`${label}: closed shell creates horizontal overflow`);

  await page.locator('.community-launcher').click();
  await page.waitForFunction(()=>document.querySelector('.community-root')?.dataset.open==='true');
  assert.equal(await page.locator('.community-panel').isVisible(),true,`${label}: panel did not open`);
  assert.equal(await page.getByRole('tab',{name:/Global Chat/i}).getAttribute('aria-selected'),'true');
  await page.waitForSelector('.chat-shell');
  assert.match((await page.locator('.chat-status').textContent())||'',/Backend setup pending|Connecting|Live|paused|Reconnecting/i,`${label}: chat status missing`);

  await page.getByRole('tab',{name:/Ask Hynoe/i}).click();
  await page.waitForSelector('.ask-form input');
  await page.locator('.ask-form input').fill('what are tokens for?');
  await page.locator('.ask-form button').click();
  await page.waitForFunction(()=>document.querySelectorAll('.ask-turn[data-role="assistant"]').length>0);
  const answer=page.locator('.ask-turn[data-role="assistant"]').last();
  assert.match((await answer.textContent())||'',/Official Hynoe/i,`${label}: Ask Hynoe did not use official knowledge first`);
  const href=await answer.locator('a').first().getAttribute('href');
  assert.ok(href?.includes('economy.html'),`${label}: Ask Hynoe did not deep-link to Economy (${href})`);
  const openLayout=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth,panel:document.querySelector('.community-panel')?.getBoundingClientRect().toJSON()}));
  assert.ok(openLayout.scrollWidth<=openLayout.innerWidth+1,`${label}: open panel creates horizontal overflow`);
  if(isMobile){assert.ok(openLayout.panel&&Math.abs(openLayout.panel.width-openLayout.innerWidth)<=1,`${label}: mobile sheet is not full width`);}

  await page.locator('.community-close').click();
  await page.waitForFunction(()=>document.querySelector('.community-root')?.dataset.open==='false');
  await page.waitForTimeout(260);
  assert.equal(await page.locator('.community-panel').isHidden(),true,`${label}: panel did not become hidden after close`);
  assert.deepEqual(errors,[],`${label}: page errors: ${errors.join(' | ')}`);
 }catch(error){await page.screenshot({path:`test-artifacts/community-${engine}-${width}-failure.png`,fullPage:false}).catch(()=>{});throw error;}finally{await context.close();}
}

await verifyCommunity({width:390,height:844,isMobile:true,hasTouch:true,label:`${engine} phone`});
await verifyCommunity({width:1280,height:800,isMobile:false,hasTouch:false,label:`${engine} desktop`});

const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(String(error)));
try{
 await page.goto(`${base}/watch.html?community-outpost=${Date.now()}`,{waitUntil:'domcontentloaded'});await page.waitForSelector('#vein-0');await page.waitForTimeout(500);
 const vein=page.locator('#vein-0');await vein.scrollIntoViewIfNeeded();const before=Number((await page.locator('#ore').textContent())||0);
 await page.locator('.community-launcher').click();await page.waitForFunction(()=>document.querySelector('.community-root')?.dataset.open==='true');await page.locator('.community-close').click();await page.waitForFunction(()=>document.querySelector('.community-root')?.dataset.open==='false');await page.waitForTimeout(260);
 await vein.tap({timeout:3000});await page.waitForTimeout(120);const after=Number((await page.locator('#ore').textContent())||0);assert.ok(after>before,`${engine} Outpost: community panel blocked Tap Mine after close (${before} -> ${after})`);
 assert.deepEqual(errors,[],`${engine} Outpost page errors: ${errors.join(' | ')}`);
}finally{await context.close();await browser.close();}
console.log(`${engine} Hynoe Community browser verification passed`);
