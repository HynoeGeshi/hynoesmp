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

test('mobile search uses a collapsible Filters control without horizontal overflow', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/search?q=photographer');

  const filtersButton = page.getByRole('button', { name: 'Filters' });
  await expect(filtersButton).toBeVisible();
  await filtersButton.click();
  await expect(page.getByRole('navigation', { name: 'Search filters' })).toBeVisible();

  const layout = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    return {
      overflow: document.documentElement.scrollWidth > width,
      width, scrollWidth: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll('main *')].map(el => {
        const rect = el.getBoundingClientRect();
        return { tag: el.tagName, cls: el.className, text: el.textContent?.slice(0, 100), left: rect.left, right: rect.right, width: rect.width };
      }).filter(rect => rect.right > width + 1 || rect.left < -1),
    };
  });
  await page.screenshot({ path: testInfo.outputPath('public-discovery.png'), fullPage: true });
  expect(layout.overflow, JSON.stringify(layout)).toBe(false);
});
