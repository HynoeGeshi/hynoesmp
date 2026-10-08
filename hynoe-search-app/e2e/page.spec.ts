import { test, expect } from '@playwright/test';

test('Hynoe SMP keeps its independent official destination', async ({ page }) => {
  await page.goto('/p/hynoe-smp');
  await expect(page.getByRole('heading', { name: 'Hynoe SMP' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Visit official destination/i })).toHaveAttribute('href', 'https://hynoesmp.com');
});

test('Flicks keeps a working public profile without linking its unavailable portfolio', async ({ page }) => {
  await page.goto('/p/hynoe-flicks');
  await expect(page.getByRole('heading', { name: 'Hynoe Flicks' })).toBeVisible();
  await expect(page.locator('a[href*="hynoeflicks.com"]')).toHaveCount(0);
  await expect(page.getByText('The separate portfolio website is being restored. There is no live portfolio or booking link on this page yet.')).toBeVisible();
});

test('Outpost links to the working origin that preserves browser progress', async ({ page }) => {
  await page.goto('/p/hynoe-outpost');
  await expect(page.getByRole('heading', { name: 'Hynoe Outpost' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Visit official destination/i })).toHaveAttribute('href', 'https://hynoesmp.com/watch.html#game');
  await expect(page.locator('a[href*="outpost.hynoe.net"]')).toHaveCount(0);
});

test('public Hynoe Page stays usable at 320px without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/p/hynoe-smp');
  await expect(page.getByRole('heading', { name: 'Hynoe SMP' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Visit official destination/i })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
