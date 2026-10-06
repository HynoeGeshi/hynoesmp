import { test, expect } from '@playwright/test';

test('Hynoe SMP keeps its independent official destination', async ({ page }) => {
  await page.goto('/p/hynoe-smp');
  await expect(page.getByRole('heading', { name: 'Hynoe SMP' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Visit official destination/i })).toHaveAttribute('href', 'https://hynoesmp.com');
});

test('Hynoe Flicks keeps its independent official destination', async ({ page }) => {
  await page.goto('/p/hynoe-flicks');
  await expect(page.getByRole('heading', { name: 'Hynoe Flicks' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Visit official destination/i })).toHaveAttribute('href', 'https://hynoeflicks.com');
});

test('Hynoe Outpost keeps its direct Hynoe destination', async ({ page }) => {
  await page.goto('/p/hynoe-outpost');
  await expect(page.getByRole('heading', { name: 'Hynoe Outpost' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Visit official destination/i })).toHaveAttribute('href', 'https://outpost.hynoe.net');
});

test('public Hynoe Page stays usable at 320px without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/p/hynoe-smp');
  await expect(page.getByRole('heading', { name: 'Hynoe SMP' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Visit official destination/i })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
