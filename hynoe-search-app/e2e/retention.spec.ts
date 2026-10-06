import { test, expect } from '@playwright/test';

test('device-local search, recent Page, save, and follow create a useful return surface', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Search Hynoe' }).fill('minecraft');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page).toHaveURL(/\/search\?q=minecraft/);

  await page.getByRole('link', { name: 'Hynoe SMP' }).first().click();
  await expect(page.getByRole('heading', { name: 'Hynoe SMP' })).toBeVisible();

  const saveButton = page.getByRole('button', { name: 'Save Page' });
  const followButton = page.getByRole('button', { name: 'Follow Page' });
  await expect(saveButton).toBeVisible();
  await expect(followButton).toBeVisible();
  await saveButton.click();
  await followButton.click();
  await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Following' })).toBeVisible();

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pick up where you left off' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Hynoe SMP' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'minecraft' })).toBeVisible();
  await expect(page.getByText(/saved and followed on this device/i)).toBeVisible();

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pick up where you left off' })).toHaveCount(0);
});
