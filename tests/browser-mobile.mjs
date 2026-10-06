import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const base='http://127.0.0.1:4173';
const phoneViewports=[
  {width:320,height:800},
  {width:360,height:800},
  {width:375,height:812},
  {width:390,height:844},
  {width:412,height:915},
  {width:430,height:932},
];
const extraViewports=[{width:768,height:1024},{width:1024,height:768},{width:844,height:390}];
const publicPages=[
  'index.html','start.html','mca.html','progression.html','economy.html','bosses.html','join.html',
  'modpack.html','updates.html','modded-minecraft-server.html','watch.html',
  'privacy.html','terms.html','data-deletion.html','community-rules.html',
];
const browser=await chromium.launch({headless:true});
await mkdir('test-artifacts',{recursive:true});

function captureErrors(page,label){
  const errors=[];
  page.on('pageerror',error=>errors.push(`${label} pageerror: ${error.message}`));
  page.on('response',response=>{if(response.status()>=400)errors.push(`${label} HTTP ${response.status()}: ${response.url()}`);});
  page.on('console',msg=>{if(msg.type()==='error'&&!/Failed to load resource/i.test(msg.text()))errors.push(`${label} console: ${msg.text()}`);});
  return errors;
}

async function assertNoHorizontalOverflow(page,label){
  const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:window.innerWidth,body:document.body.scrollWidth}));
  assert.ok(dims.scroll<=dims.width+1,`${label}: document overflow ${dims.scroll} > ${dims.width}`);
  assert.ok(dims.body<=dims.width+1,`${label}: body overflow ${dims.body} > ${dims.width}`);
}

async function dismissFirstRunGuide(page,label){
  await page.waitForTimeout(550);
  const guide=page.locator('#how-to-play');
  const open=await guide.evaluate(el=>el.open);
  if(!open)return;
  const box=await guide.boundingBox();
  const viewport=page.viewportSize();
  assert.ok(box&&viewport,`${label}: onboarding guide has no measurable viewport box`);
  assert.ok(box.x>=-1&&box.x+box.width<=viewport.width+1,`${label}: onboarding guide overflows horizontally`);
  const close=guide.locator('.dialog-close');
  assert.ok(await close.isVisible(),`${label}: onboarding close control is not visible`);
  await close.click();
  await page.waitForTimeout(50);
  assert.equal(await guide.evaluate(el=>el.open),false,`${label}: onboarding guide did not close`);
}

async function gridColumns(page){
  return page.locator('#vein-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length);
}

async function tapsLeft(locator){
  const text=await locator.locator('small').innerText();
  const match=text.match(/(\d+) tap/);
  return match?Number(match[1]):null;
}

async function assertVeinsFullyVisible(page,label){
  const result=await page.evaluate(()=>{
    const scene=document.querySelector('.mine-scene.mine-v2');
    const sceneBox=scene?.getBoundingClientRect();
    const cards=[...document.querySelectorAll('.vein')].map(card=>{
      const box=card.getBoundingClientRect();
      const strong=card.querySelector('strong');
      const small=card.querySelector('small');
      const strongBox=strong?.getBoundingClientRect();
      const smallBox=small?.getBoundingClientRect();
      const strongStyle=strong?getComputedStyle(strong):null;
      const smallStyle=small?getComputedStyle(small):null;
      return {
        top:box.top,bottom:box.bottom,left:box.left,right:box.right,
        strong:strong?.textContent?.trim()||'',small:small?.textContent?.trim()||'',
        strongHeight:strongBox?.height||0,smallHeight:smallBox?.height||0,
        strongVisible:!!strongStyle&&strongStyle.display!=='none'&&strongStyle.visibility!=='hidden'&&Number(strongStyle.opacity)>0,
        smallVisible:!!smallStyle&&smallStyle.display!=='none'&&smallStyle.visibility!=='hidden'&&Number(smallStyle.opacity)>0,
      };
    });
    return {scene:sceneBox?{top:sceneBox.top,bottom:sceneBox.bottom,left:sceneBox.left,right:sceneBox.right}:null,cards};
  });
  assert.ok(result.scene,`${label}: mine scene missing`);
  assert.equal(result.cards.length,12,`${label}: expected 12 mine cards`);
  for(const [index,card] of result.cards.entries()){
    assert.ok(card.bottom<=result.scene.bottom+1,`${label}: vein ${index} is clipped below the mine scene`);
    assert.ok(card.left>=result.scene.left-1&&card.right<=result.scene.right+1,`${label}: vein ${index} is clipped horizontally`);
    assert.ok(card.strong&&card.small,`${label}: vein ${index} missing label text`);
    assert.ok(card.strongVisible&&card.smallVisible&&card.strongHeight>0&&card.smallHeight>0,`${label}: vein ${index} label text is not visible`);
  }
}

for(const viewport of [...phoneViewports,...extraViewports]){
  const isMobile=viewport.width<900;
  const context=await browser.newContext({viewport,hasTouch:isMobile,isMobile});
  const page=await context.newPage();
  const label=`watch ${viewport.width}x${viewport.height}`;
  const errors=captureErrors(page,label);
  await page.goto(`${base}/watch.html`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#vein-11');
  await dismissFirstRunGuide(page,label);
  await assertNoHorizontalOverflow(page,label);

  const cols=await gridColumns(page);
  const expected=viewport.width<480?2:viewport.width<900?3:4;
  assert.equal(cols,expected,`${label}: expected ${expected} mine columns, got ${cols}`);

  const minVeinHeight=await page.locator('#vein-0').evaluate(el=>el.getBoundingClientRect().height);
  assert.ok(minVeinHeight>=88,`${label}: vein target only ${minVeinHeight}px tall`);
  await assertVeinsFullyVisible(page,label);

  const tabs=page.locator('.game .tabs');
  assert.ok(await tabs.isVisible(),`${label}: game tabs are not visible`);

  if(viewport.width<=430){
    const targetIndex=await page.locator('.vein').evaluateAll(nodes=>nodes.findIndex(node=>{
      const n=Number((node.querySelector('small')?.textContent.match(/(\d+) tap/)||[])[1]);
      return n>=3;
    }));
    assert.ok(targetIndex>=0,`${label}: no suitable vein found for tap regression`);
    const vein=page.locator('.vein').nth(targetIndex);
    const before=await tapsLeft(vein);
    await vein.tap();
    await page.waitForTimeout(100);
    const afterTouch=await tapsLeft(vein);
    assert.equal(afterTouch,before-1,`${label}: one touch must reduce taps-left exactly once`);
    await vein.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    const afterKeyboard=await tapsLeft(vein);
    assert.equal(afterKeyboard,afterTouch-1,`${label}: keyboard activation must still mine exactly once`);
  }

  if(viewport.width===390){
    const beforeUrl=page.url();
    const play=page.locator('#video .play-broadcast');
    assert.ok(await play.isVisible(),`${label}: on-site stream play button is missing`);
    await play.click();
    await page.waitForSelector('#video iframe',{timeout:4000});
    const frameSrc=await page.locator('#video iframe').getAttribute('src');
    assert.match(frameSrc||'',/youtube-nocookie\.com\/embed\//,`${label}: stream iframe is not privacy-enhanced YouTube embed`);
    assert.equal(new URL(page.url()).pathname,new URL(beforeUrl).pathname,`${label}: primary stream button navigated away from Hynoe`);
  }

  if(viewport.width===390||viewport.width===1024){
    await page.screenshot({path:`test-artifacts/watch-${viewport.width}.png`,fullPage:true});
  }
  assert.deepEqual(errors,[],`${label}: browser errors detected\n${errors.join('\n')}`);
  await context.close();
}

for(const viewport of [{width:320,height:800},{width:390,height:844},{width:430,height:932},{width:1024,height:768}]){
  const context=await browser.newContext({viewport,hasTouch:viewport.width<900,isMobile:viewport.width<900});
  const page=await context.newPage();
  const label=`home ${viewport.width}x${viewport.height}`;
  const errors=captureErrors(page,label);
  await page.goto(`${base}/index.html`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.hero-actions');
  await page.waitForTimeout(200);
  await assertNoHorizontalOverflow(page,label);
  const heroLinks=page.locator('.hero-actions a');
  assert.equal(await heroLinks.count(),3,`${label}: hero should expose exactly 3 primary actions`);
  const hrefs=await heroLinks.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
  assert.deepEqual(hrefs,['join.html','modpack.html','watch.html'],`${label}: hero CTA order changed`);
  const minHeights=await heroLinks.evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().height));
  assert.ok(minHeights.every(n=>n>=44),`${label}: a primary CTA is smaller than 44px`);
  const dashCols=await page.locator('.world-dashboard').evaluate(el=>getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length);
  if(viewport.width<=600)assert.equal(dashCols,1,`${label}: dashboard should be one column on narrow phones`);
  if(viewport.width===390||viewport.width===1024){
    await page.screenshot({path:`test-artifacts/home-${viewport.width}.png`,fullPage:true});
  }
  assert.deepEqual(errors,[],`${label}: browser errors detected\n${errors.join('\n')}`);
  await context.close();
}

for(const pageName of publicPages){
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const page=await context.newPage();
  const label=`sitewide ${pageName}`;
  const errors=captureErrors(page,label);
  await page.goto(`${base}/${pageName}`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('main');
  await page.waitForTimeout(150);
  await assertNoHorizontalOverflow(page,label);
  assert.equal(await page.locator('link[href*="site-refresh.css?v=20261006b"]').count(),1,`${label}: shared refresh stylesheet missing`);
  const content=await page.locator('main').evaluate(el=>({text:el.innerText.trim(),height:el.getBoundingClientRect().height,display:getComputedStyle(el).display,visibility:getComputedStyle(el).visibility}));
  assert.ok(content.text.length>80,`${label}: main text did not render`);
  assert.ok(content.height>120&&content.display!=='none'&&content.visibility!=='hidden',`${label}: main content is not visible`);
  assert.deepEqual(errors,[],`${label}: browser errors detected\n${errors.join('\n')}`);
  await context.close();
}

await browser.close();
console.log('Browser verification passed for mobile mining, visible labels, on-site stream playback, all public pages, touch/keyboard input, and overflow.');
