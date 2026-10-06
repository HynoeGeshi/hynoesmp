import { test, expect } from '@playwright/test';

test('homepage stays usable at 320px without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');

  await expect(page.getByRole('textbox', { name: 'Search Hynoe' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

test('homepage disables decorative motion when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const animationDuration = await page.locator('[data-decorative-motion]').evaluate((element) => getComputedStyle(element).animationDuration);
  expect(animationDuration).not.toBe('8s');
});
