import { test, expect } from '@playwright/test';

test('blank search remains a useful discovery state', async ({ page }) => {
  await page.goto('/search');
  await expect(page.getByRole('heading', { name: 'Discover on Hynoe' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Hynoe Outpost/i }).first()).toBeVisible();
});

test('known photographer query surfaces Hynoe Flicks and opens its Page', async ({ page }) => {
  await page.goto('/search?q=photographer');
  await expect(page.getByRole('heading', { name: /Results for “photographer”/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hynoe Flicks' })).toBeVisible();
  await page.getByRole('link', { name: 'Hynoe Flicks' }).first().click();
  await expect(page).toHaveURL(/\/p\/hynoe-flicks$/);
});

test('unknown query has a clear zero-results state', async ({ page }) => {
  await page.goto('/search?q=zzzz-no-match-zzzz');
  await expect(page.getByRole('heading', { name: 'No matches yet.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Explore Hynoe' })).toBeVisible();
});

test('mobile search uses a collapsible Filters control without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/search?q=photographer');

  const filtersButton = page.getByRole('button', { name: 'Filters' });
  await expect(filtersButton).toBeVisible();
  await filtersButton.click();
  await expect(page.getByRole('navigation', { name: 'Search filters' })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
