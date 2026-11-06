import { expect, test } from '@playwright/test';

test('mobile navigation opens the settings drawer', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#sidebar')).not.toHaveClass(/open/);
  await page.locator('#menu-toggle').click();
  await expect(page.locator('#sidebar')).toHaveClass(/open/);

  await page.locator('#theme-select').selectOption('nord');
  await expect(page.locator('#export-container')).toHaveAttribute('data-theme', 'nord');

  await page.locator('#sidebar-close').click();
  await expect(page.locator('#sidebar')).not.toHaveClass(/open/);
});

test('mobile preview stays usable', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#export-container')).toBeVisible();
  await expect(page.locator('#open-export-top')).toBeVisible();
});
