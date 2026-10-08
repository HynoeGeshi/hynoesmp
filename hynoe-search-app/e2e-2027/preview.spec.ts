import { test, expect } from '@playwright/test';

const slugs = ['directory-adobe','directory-ableton','directory-bh-photo-video','directory-canva','directory-chicago-music-exchange'];

test('preview loads with strict headers and interactive filters', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  const response = await page.goto('/preview');
  expect(response?.status()).toBe(200);
  expect(response?.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(response?.headers()['cache-control']).toContain('no-store');
  await expect(page.locator('html')).toHaveClass(/js/);
  await expect(page.locator('[data-business-card]:visible')).toHaveCount(5);
  await page.locator('#business-query').fill('Chicago');
  await expect(page.locator('[data-business-card]:visible')).toHaveCount(1);
  await expect(page.locator('[data-business-card]:visible')).toContainText('Chicago Music Exchange');
  await page.locator('#business-reset').click();
  await page.locator('#business-category').selectOption('Creative software');
  await expect(page.locator('[data-business-card]:visible')).toHaveCount(2);
  await page.locator('#business-query').fill('a-name-that-is-not-listed');
  await expect(page.locator('#business-empty')).toBeVisible();
  await page.locator('#business-reset-empty').click();
  await expect(page.locator('[data-business-card]:visible')).toHaveCount(5);
  await page.locator('[data-filter="play"]').click();
  await expect(page.locator('.project-card:visible')).toHaveCount(2);
  expect(errors).toEqual([]);
});

for (const width of [360,390,768,1024,1440,1920]) {
  test(`responsive preview at ${width}px without horizontal overflow`, async ({ page }, info) => {
    await page.setViewportSize({width,height:1000});
    await page.goto('/preview');
    const layout = await page.evaluate(() => ({overflow:document.documentElement.scrollWidth > window.innerWidth + 1, offenders:[...document.querySelectorAll('body *')].map(el => ({tag:el.tagName,cls:el.className,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right})).filter(r=>r.right>innerWidth+1&&r.left>=0).slice(0,10)}));
    expect(layout.overflow,JSON.stringify(layout)).toBe(false);
    if (width <= 1040) {
      const toggle = page.locator('.menu-toggle');
      await toggle.click(); await expect(toggle).toHaveAttribute('aria-expanded','true');
      await expect(page.locator('#mobile-menu a[href="#businesses"]')).toBeVisible();
      await page.locator('#mobile-menu a[href="#businesses"]').click();
      await expect(toggle).toHaveAttribute('aria-expanded','false');
    }
    await page.screenshot({path: info.outputPath(`preview-${width}.png`),fullPage:true});
  });
}

test('preview anchors and every linked local destination resolve', async ({ page, request }) => {
  await page.goto('/preview');
  const anchors = await page.locator('a[href^="#"]').evaluateAll(els => els.map(a => a.getAttribute('href')!.slice(1)));
  for (const id of new Set(anchors)) expect(await page.locator(`[id="${id}"]`).count(),`anchor ${id}`).toBeGreaterThan(0);
  const urls = await page.locator('a[href^="/"]').evaluateAll(els => [...new Set(els.map(a => a.getAttribute('href')!))]);
  for (const url of urls) {
    const result = await request.get(url,{timeout:15000});
    expect(result.status(),url).toBeLessThan(400);
  }
});

test('directory search returns genuine profiles and handles unusual parameters', async ({ page, request }) => {
  await page.goto('/search?q=Adobe');
  await expect(page.getByRole('heading',{name:'Adobe',exact:true})).toBeVisible();
  await expect(page.getByText('Public listing · unclaimed')).toBeVisible();
  await page.goto('/search?scope=directory');
  await expect(page.locator('.result-card')).toHaveCount(5);
  await page.goto('/search?type=creator');
  await expect(page.getByRole('heading',{name:'Hynoe',exact:true})).toBeVisible();
  expect((await request.get('/search?q=Adobe&q=Canva&type=invalid')).status()).toBe(200);
  expect((await request.get('/p/hynoe-missing-page-9e7c')).status()).toBe(404);
  await page.goto('/search?q=totally-nonexistent-business-2027');
  await expect(page.getByRole('heading',{name:'No matches yet.'})).toBeVisible();
});

test('outside profiles expose provenance and never provide an owner inquiry form', async ({ page }) => {
  for (const slug of slugs) {
    await page.goto(`/p/${slug}`);
    await expect(page.getByText('Unclaimed public-information listing',{exact:true})).toBeVisible();
    await expect(page.getByRole('link',{name:'View the source ↗'})).toBeVisible();
    await expect(page.locator('form')).toHaveCount(0);
    await expect(page.locator('a[href*="listing-policy?listing="]')).toHaveCount(1);
  }
});

test('old broken Hynoe destinations are not offered from product profiles', async ({ page }) => {
  await page.goto('/p/hynoe-outpost');
  await expect(page.locator('a[href="https://hynoesmp.com/watch.html#game"]').first()).toBeVisible();
  await expect(page.locator('a[href*="outpost.hynoe.net"]')).toHaveCount(0);
  await page.goto('/p/hynoe-flicks');
  await expect(page.locator('a[href*="hynoeflicks.com"]')).toHaveCount(0);
  await expect(page.getByText('The separate portfolio website is being restored. There is no live portfolio or booking link on this page yet.')).toBeVisible();
});

test('policy and correction path do not pretend to submit or grant ownership', async ({ page }) => {
  await page.goto('/listing-policy?listing=directory-adobe#corrections');
  await expect(page.getByRole('heading',{name:'Correction, removal or ownership review'})).toBeVisible();
  await expect(page.getByRole('link',{name:'Adobe',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Open official Hynoe Discord ↗'})).toHaveAttribute('href','https://discord.gg/wYTePCkXd5');
  await expect(page.locator('form')).toHaveCount(0);
});

test('owner routes remain inaccessible to an unauthenticated browser', async ({ page }) => {
  for (const path of ['/command-center','/command-center/pages/new','/command-center/inquiries']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByRole('heading',{name:'Sign in to Hynoe'})).toBeVisible();
  }
});

test('no-JavaScript users see all businesses and can use native Search', async ({ browser }) => {
  const context = await browser.newContext({javaScriptEnabled:false});
  const page = await context.newPage();
  await page.goto('http://localhost:3100/preview');
  await expect(page.locator('[data-business-card]:visible')).toHaveCount(5);
  await page.locator('#search-q').fill('Adobe');
  await page.locator('.search-form button[type="submit"]').click();
  await expect(page.getByRole('heading',{name:'Adobe',exact:true})).toBeVisible();
  await context.close();
});
