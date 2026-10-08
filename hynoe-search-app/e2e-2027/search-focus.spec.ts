import { test, expect } from '@playwright/test';

test('the homepage puts search before promotion', async ({ page }) => {
  await page.goto('/preview');
  await expect(page).toHaveTitle(/Hynoe Search/);
  await expect(page.getByRole('heading', { name: 'Find your next thing.', exact: true })).toBeVisible();
  await expect(page.locator('#search-q')).toBeVisible();
  await expect(page.locator('.ops-feature,.sprint-strip,.network-art,.community-grid')).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Search categories' })).toBeVisible();
  await expect(page.locator('main .project-card')).toHaveCount(0);
  const input = await page.locator('#search-q').boundingBox();
  expect(input?.y).toBeLessThan(600);
});

test('homepage search reaches a real result and profile', async ({ page }) => {
  await page.goto('/preview');
  await page.locator('#search-q').fill('Adobe');
  await page.locator('.search-form button[type="submit"]').click();
  await expect(page.locator('.result-card')).toHaveCount(1);
  await page.getByRole('heading', {name:'Adobe',exact:true}).getByRole('link').click();
  await expect(page.getByText('Unclaimed public-information listing', {exact:true})).toBeVisible();
});

test('search remains usable on a small phone and a large display', async ({page}) => {
  for (const width of [320,390,768,1440,1920]) {
    await page.setViewportSize({width,height:900});
    await page.goto('/preview');
    await expect(page.locator('#search-q')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
});
