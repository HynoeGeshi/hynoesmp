import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const base=process.env.HYNOE_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
fs.mkdirSync('test-artifacts',{recursive:true});
const widths=[320,360,375,390,412,430];

for(const width of widths){
  const label=`first-load ${width}x844`;
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  try{
    await page.goto(`${base}/watch.html?firstload=${Date.now()}-${width}`,{waitUntil:'domcontentloaded'});
    await page.waitForSelector('#vein-11');
    await page.waitForTimeout(800);

    const guide=page.locator('#how-to-play');
    assert.equal(await guide.evaluate(el=>el.open),false,`${label}: Help modal must not auto-open over the game`);

    const vein=page.locator('#vein-0');
    await vein.scrollIntoViewIfNeeded();
    const visual=await vein.evaluate(el=>{
      const face=el.querySelector('.gem-face');
      const strong=el.querySelector('strong');
      const small=el.querySelector('small');
      const rect=el.getBoundingClientRect();
      const center=document.elementsFromPoint(rect.left+rect.width/2,rect.top+rect.height/2);
      return {
        faceFill:face?getComputedStyle(face).fill:'',
        strongVisible:!!strong&&getComputedStyle(strong).display!=='none'&&strong.getBoundingClientRect().height>0,
        smallVisible:!!small&&getComputedStyle(small).display!=='none'&&small.getBoundingClientRect().height>0,
        hitTarget:center.includes(el),
        scrollWidth:document.documentElement.scrollWidth,
        innerWidth
      };
    });
    assert.ok(visual.faceFill&&!['rgb(0, 0, 0)','rgba(0, 0, 0, 0)','transparent','none'].includes(visual.faceFill),`${label}: ore face rendered black/transparent (${visual.faceFill})`);
    assert.ok(visual.strongVisible&&visual.smallVisible,`${label}: ore labels are not visible`);
    assert.ok(visual.hitTarget,`${label}: vein is not the active hit target`);
    assert.ok(visual.scrollWidth<=visual.innerWidth+1,`${label}: horizontal overflow ${visual.scrollWidth} > ${visual.innerWidth}`);

    const before=Number((await page.locator('#ore').textContent())||0);
    await vein.tap({timeout:3000});
    await page.waitForTimeout(120);
    const after=Number((await page.locator('#ore').textContent())||0);
    assert.ok(after>before,`${label}: first physical tap did not register (${before} -> ${after})`);

    const repeatedBefore=after;
    for(let i=0;i<20;i++){
      await vein.tap({timeout:3000});
      await page.waitForTimeout(18);
    }
    await page.waitForTimeout(150);
    const repeatedAfter=Number((await page.locator('#ore').textContent())||0);
    assert.ok(repeatedAfter>=repeatedBefore+20,`${label}: repeated physical taps were lost or blocked (${repeatedBefore} -> ${repeatedAfter})`);

    await page.locator('#open-help').click();
    assert.equal(await guide.evaluate(el=>el.open),true,`${label}: Help button did not open guide`);
    await page.locator('#how-to-play .dialog-close').click();
    assert.equal(await guide.evaluate(el=>el.open),false,`${label}: Help modal did not close`);

    await page.goto(`${base}/?firstload=${Date.now()}-${width}`,{waitUntil:'domcontentloaded'});
    const home=await page.evaluate(()=>{
      const hotbar=document.querySelector('.hotbar');
      const hr=hotbar?.getBoundingClientRect();
      const covers=[...document.querySelectorAll('body *')].filter(el=>{
        const r=el.getBoundingClientRect(),s=getComputedStyle(el);
        const intersects=r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight;
        return intersects&&(s.position==='fixed'||s.position==='sticky')&&s.pointerEvents!=='none'&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>=innerWidth*.9&&r.height>=innerHeight*.7;
      });
      return {hotbar:hr?hr.toJSON():null,covers:covers.map(el=>el.id||String(el.className)||el.tagName),scrollWidth:document.documentElement.scrollWidth,innerWidth,innerHeight};
    });
    assert.ok(home.hotbar,`${label}: homepage hotbar missing`);
    assert.ok(home.hotbar.height<=96,`${label}: mobile hotbar stretched to ${home.hotbar.height}px`);
    assert.ok(home.hotbar.top>=0&&home.hotbar.bottom<=home.innerHeight+1,`${label}: mobile hotbar is outside viewport`);
    assert.deepEqual(home.covers,[],`${label}: homepage has a viewport-covering fixed/sticky layer: ${home.covers.join(', ')}`);
    assert.ok(home.scrollWidth<=home.innerWidth+1,`${label}: homepage horizontal overflow ${home.scrollWidth} > ${home.innerWidth}`);
  }catch(error){
    await page.screenshot({path:`test-artifacts/first-load-${width}-failure.png`,fullPage:false}).catch(()=>{});
    throw error;
  }finally{
    await context.close();
  }
}
await browser.close();
console.log(`first-load mobile matrix passed at ${widths.join(', ')}px`);
