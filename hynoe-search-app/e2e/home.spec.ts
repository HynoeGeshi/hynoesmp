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

test('homepage search reaches a real Hynoe Page and keyboard focus stays visible', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('textbox', { name: 'Search Hynoe' });

  for (let attempt = 0; attempt < 10; attempt += 1) {
    await page.keyboard.press('Tab');
    if (await search.evaluate((element) => element === document.activeElement)) break;
  }

  await expect(search).toBeFocused();
  const outlineStyle = await search.evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(outlineStyle).not.toBe('none');

  await search.fill('minecraft');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page).toHaveURL(/\/search\?q=minecraft/);
  await page.getByRole('link', { name: 'Hynoe SMP' }).first().click();
  await expect(page.getByRole('heading', { name: 'Hynoe SMP' })).toBeVisible();
});

test('core and premium Hynoe brand assets are actually served', async ({ page }) => {
  await page.goto('/');
  const core = await page.request.get('/brand/hynoe-core-mark.png');
  const premium = await page.request.get('/brand/hynoe-premium-mark.png');
  expect(core.ok()).toBe(true);
  expect(premium.ok()).toBe(true);
});

test('public and sign-in responses carry the browser security policy', async ({ request }) => {
  for (const path of ['/', '/search?q=minecraft', '/p/hynoe-smp', '/sign-in']) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    const headers = response.headers();
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['cross-origin-opener-policy']).toBe('same-origin');
    expect(headers['permissions-policy']).toBe('camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  }
});
