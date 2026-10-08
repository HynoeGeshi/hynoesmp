import { test, expect } from '@playwright/test';

test('featured public Pages are visible, usable and link to real profile routes', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  const discovery = page.getByRole('region', { name: 'Featured public pages' });
  await expect(discovery).toBeVisible();
  await expect(discovery.getByRole('link', { name: 'Open Hynoe SMP public page' })).toBeVisible();
  await expect(discovery.getByText(/not verification or an endorsement/i)).toBeVisible();
  await expect(discovery.getByRole('status')).toHaveCount(0);
  await discovery.screenshot({ path: testInfo.outputPath('public-discovery.png') });
  const card = discovery.getByRole('link', { name: 'Open Hynoe SMP public page' });
  await card.focus();
  await expect(card).toBeFocused();
  const box = await card.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(await card.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none');
  await card.press('Enter');
  await expect(page).toHaveURL(/\/p\/hynoe-smp$/);
  await expect(page.getByRole('heading', { name: 'Hynoe SMP' })).toBeVisible();
  await expect(page.getByText('Hynoe Page', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('public discovery fits small screens and respects reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const discovery = page.getByRole('region', { name: 'Featured public pages' });
  await expect(discovery).toBeVisible();
  const card = discovery.locator('article').first();
  expect(await card.evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test('search handles unknown queries and Render host requests without a missing-route error', async ({ page }) => {
  // Avoid real tokens such as "hynoe": Search intentionally accepts partial token matches.
  const search = await page.goto('/search?q=zzzznomatchzzzz');
  expect(search?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'No matches yet.' })).toBeVisible();
  const renderHost = await page.request.get('/search?q=minecraft', { headers: { host: 'hynoe-search-direct.onrender.com' } });
  expect(renderHost.status()).toBe(200);
  expect(await renderHost.text()).toContain('Hynoe SMP');
  const unknown = await page.request.get('/p/hynoe-missing-page-9e7c');
  expect(unknown.status()).toBe(404);
});
