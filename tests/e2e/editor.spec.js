import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#code-display')).toContainText('greet');
});

test('renders the editor, preview and document metadata', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await expect(page).toHaveTitle(/CodeSnap/);
  await expect(page.locator('#export-container')).toBeVisible();
  await expect(page.locator('#code-display .token')).not.toHaveCount(0);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    /manifest\.webmanifest/,
  );

  expect(errors).toEqual([]);
});

test('updates the preview when the snippet changes', async ({ page }) => {
  await page.locator('#code-input').fill('const answer = 42;\nconsole.log(answer);');

  await expect(page.locator('#code-display')).toContainText('const answer = 42;');
  await expect(page.locator('#code-stats')).toContainText('JavaScript');
});

test('switches syntax theme and window chrome', async ({ page }) => {
  await page.locator('#theme-select').selectOption('dracula');
  await expect(page.locator('#export-container')).toHaveAttribute('data-theme', 'dracula');

  await page.locator('#line-numbers-switch').check();
  await expect(page.locator('#line-numbers')).toBeVisible();
  await expect(page.locator('#line-numbers')).toContainText('1');

  await page.locator('#window-controls-switch').uncheck();
  await expect(page.locator('#window-dots')).toBeHidden();

  await page.locator('#window-title').fill('auth.service.ts');
  await expect(page.locator('#window-label')).toHaveText('auth.service.ts');
});

test('highlights a language whose grammar loads on demand', async ({ page }) => {
  await page.locator('#code-input').fill('def greet(name):\n    return name');
  await page.locator('#lang-select').selectOption('python');

  await expect(page.locator('#window-label')).toHaveText('Python');
  await expect(page.locator('#code-display .token.keyword').first()).toHaveText('def');
  await expect(page.locator('#code-display')).toContainText('return name');
});

test('persists the snippet across reloads', async ({ page }) => {
  await page.locator('#code-input').fill('const persisted = true;');
  await page.waitForTimeout(900);

  await page.reload();
  await expect(page.locator('#code-input')).toHaveValue('const persisted = true;');
});

test('shows undo and redo for settings outside the editor', async ({ page }) => {
  await page.locator('#theme-select').selectOption('dracula');
  await expect(page.locator('#export-container')).toHaveAttribute('data-theme', 'dracula');

  await page.locator('#stage-main').click();
  await page.keyboard.press('Control+z');
  await expect(page.locator('#export-container')).toHaveAttribute('data-theme', 'tomorrow');

  await page.keyboard.press('Control+Shift+z');
  await expect(page.locator('#export-container')).toHaveAttribute('data-theme', 'dracula');
});

test('downloads a PNG through the export dialog', async ({ page }) => {
  await page.locator('#open-export').click();
  await expect(page.locator('#export-dialog')).toBeVisible();

  await page.locator('#export-scale').evaluate((element) => {
    element.value = '1';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('#export-scale-value')).toHaveText('1×');

  const downloadPromise = page.waitForEvent('download', { timeout: 60_000 });
  await page.locator('#export-download').click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^codesnap-js-\d{8}-\d{6}\.png$/);
  await expect(page.locator('#export-dialog')).toBeHidden();
});

test('creates a shareable URL', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('#code-input').fill('print("shared")');
  await page.waitForTimeout(400);

  await page.locator('#copy-link').click();

  await expect.poll(() => page.url()).toContain('#s=');

  await page.reload();
  await expect(page.locator('#code-input')).toHaveValue('print("shared")');
});

test('opens the shortcuts dialog', async ({ page }) => {
  await page.locator('#open-help').click();
  await expect(page.locator('#help-dialog')).toBeVisible();
  await expect(page.locator('#help-dialog')).toContainText('Ctrl / ⌘ + S');

  await page.locator('#help-close').click();
  await expect(page.locator('#help-dialog')).toBeHidden();
});

test('loads no third-party runtime assets', async ({ page }) => {
  const external = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    if (url.origin !== new URL(page.url()).origin) external.push(request.url());
  });

  await page.reload();
  await expect(page.locator('#code-display')).toContainText('greet');
  await page.waitForTimeout(500);

  expect(external).toEqual([]);
});

test('boots offline after the service worker is ready', async ({ page, context }) => {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.locator('#code-display')).toContainText('greet');

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#code-display')).toContainText('greet');
  await expect(page.locator('#offline-banner')).toBeVisible();
  await context.setOffline(false);
});

test('registers the service worker', async ({ page }) => {
  await expect
    .poll(
      async () =>
        page.evaluate(async () => {
          if (!('serviceWorker' in navigator)) return false;
          const registration = await navigator.serviceWorker.getRegistration();
          return Boolean(registration);
        }),
      { timeout: 20_000 },
    )
    .toBe(true);
});
