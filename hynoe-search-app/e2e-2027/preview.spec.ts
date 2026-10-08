import { test, expect } from '@playwright/test';
const slugs = ['directory-adobe','directory-ableton','directory-bh-photo-video','directory-canva','directory-chicago-music-exchange'];

test('search preview has strict headers and ordinary indexed listings', async ({ page }) => {
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('/preview');
  expect(response?.status()).toBe(200);
  expect(response?.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(response?.headers()['cache-control']).toContain('no-store');
  await expect(page.locator('[data-index-entry]')).toHaveCount(10);
  const names=await page.locator('[data-index-entry] h3').allTextContents();
  expect(names).toEqual([...names].sort((a,b)=>a.localeCompare(b)));
  for(const slug of ['hynoe','hynoe-flicks','hynoe-outpost','hynoe-smp','hynoe-creatorops']) await expect(page.locator(`[data-index-entry][data-slug="${slug}"]`)).toHaveCount(1);
  expect(errors).toEqual([]);
});
for(const width of [320,390,768,1024,1440,1920])test(`responsive search preview at ${width}px`,async({page},info)=>{
  await page.setViewportSize({width,height:1000});await page.goto('/preview');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await expect(page.locator('#search-q')).toBeVisible();
  await page.screenshot({path:info.outputPath(`search-${width}.png`),fullPage:true});
});
test('every local destination and page anchor resolves',async({page,request})=>{
  await page.goto('/preview');
  const ids=await page.locator('a[href^="#"]').evaluateAll(els=>els.map(a=>a.getAttribute('href')!.slice(1)));
  for(const id of new Set(ids))await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
  const urls=await page.locator('a[href^="/"]').evaluateAll(els=>[...new Set(els.map(a=>a.getAttribute('href')!))]);
  for(const url of urls)expect((await request.get(url,{timeout:15000})).status(),url).toBeLessThan(400);
});
test('directory search remains precise and handles unknown pages',async({page,request})=>{
  await page.goto('/search?q=Adobe');await expect(page.locator('.result-card')).toHaveCount(1);
  await expect(page.getByRole('heading',{name:'Adobe',exact:true})).toBeVisible();
  await expect(page.getByText('Public listing · unclaimed')).toBeVisible();
  await page.goto('/search?scope=directory');await expect(page.locator('.result-card')).toHaveCount(5);
  expect((await request.get('/p/hynoe-missing-page-9e7c')).status()).toBe(404);
  expect((await request.get('/search?q=Adobe&q=Canva&type=invalid')).status()).toBe(200);
  await page.goto('/search?q=zzzzunlistedqvkjz2027');await expect(page.getByRole('heading',{name:'No matches yet.'})).toBeVisible();
});
test('outside profiles keep provenance and do not impersonate owners',async({page})=>{
  for(const slug of slugs){await page.goto(`/p/${slug}`);await expect(page.getByText('Unclaimed public-information listing',{exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'View the source ↗'})).toBeVisible();await expect(page.locator('form')).toHaveCount(0);}
});
test('owner projects have ordinary profile routes and working destinations',async({page})=>{
  for(const slug of ['hynoe','hynoe-flicks','hynoe-outpost','hynoe-smp','hynoe-creatorops']){
    const response=await page.goto(`/p/${slug}`);expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);await expect(page.getByRole('link',{name:'Hynoe home',exact:true})).toHaveAttribute('href','/preview');
  }
  await page.goto('/p/hynoe-outpost');await expect(page.locator('a[href="https://hynoesmp.com/watch.html#game"]').first()).toBeVisible();
  await page.goto('/p/hynoe-flicks');await expect(page.locator('a[href*="hynoeflicks.com"]')).toHaveCount(0);
});
test('owner workspace still requires sign-in',async({page})=>{
  for(const path of ['/command-center','/command-center/pages/new','/command-center/inquiries']){await page.goto(path);await expect(page).toHaveURL(/\/sign-in/);await expect(page.getByRole('heading',{name:'Sign in to Hynoe'})).toBeVisible();}
});
test('native search works without JavaScript',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
  await page.goto('http://localhost:3100/preview');await expect(page.locator('[data-index-entry]')).toHaveCount(10);
  await page.locator('#search-q').fill('photographer');await page.locator('.search-form button[type="submit"]').click();
  await expect(page.getByRole('heading',{name:'Hynoe Flicks',exact:true})).toBeVisible();await context.close();
});
