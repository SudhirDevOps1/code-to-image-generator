import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, devices } from '@playwright/test';

/**
 * Regenerate the documentation and PWA screenshots from a running preview.
 *
 *   npm run build
 *   npm run preview -- --host 127.0.0.1
 *   npm run screenshots        # in another terminal
 *
 * Set PREVIEW_URL to target a different origin.
 */
const BASE = process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173';
const OUT = path.join(process.cwd(), 'public', 'screenshots');

const waitForFonts = (page) =>
  page.waitForFunction(() => document.fonts.status === 'loaded', null, { timeout: 15_000 });

/** Transient status toasts must not leak into documentation screenshots. */
const hideToast = (page) =>
  page.evaluate(() => {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.classList.remove('visible');
    // Keep it hidden even if a late "Offline ready" callback fires.
    toast.hidden = true;
  });

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch();

  // ---------- Desktop ----------
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
  });
  const page = await desktop.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await waitForFonts(page);
  // Let the one-off "Offline ready" toast clear before capturing.
  await page.waitForTimeout(1500);
  await hideToast(page);

  await page.screenshot({ path: path.join(OUT, 'main-interface.png') });

  // Themes: a different palette, preset, window title and line numbers.
  await page.locator('#theme-select').selectOption('dracula');
  await page.locator('#line-numbers-switch').check();
  await page.locator('#window-title').fill('greet.js');
  await page.locator('.swatch').nth(1).click();
  await page.evaluate(() => {
    const scroll = document.querySelector('.sidebar-scroll');
    if (scroll) scroll.scrollTop = 0;
  });
  await page.waitForTimeout(250);
  await hideToast(page);
  await page.screenshot({ path: path.join(OUT, 'themes.png') });

  // Export dialog with a live dimension estimate.
  await page.locator('#open-export').click();
  await page.locator('#export-dialog').waitFor({ state: 'visible' });
  await page.waitForTimeout(250);
  await hideToast(page);
  await page.screenshot({ path: path.join(OUT, 'export-preview.png') });
  await desktop.close();

  // ---------- Mobile ----------
  const mobile = await browser.newContext({
    ...devices['Pixel 7'],
    deviceScaleFactor: 1,
    colorScheme: 'dark',
  });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(BASE, { waitUntil: 'networkidle' });
  await waitForFonts(mobilePage);
  await mobilePage.waitForTimeout(1500);
  await hideToast(mobilePage);

  // Show the responsive settings drawer; the preview itself is intentionally
  // pannable when a snippet is wider than the phone viewport.
  await mobilePage.locator('#menu-toggle').click();
  await mobilePage.locator('#sidebar.open').waitFor({ state: 'visible' });
  await mobilePage.waitForTimeout(250);
  await mobilePage.screenshot({ path: path.join(OUT, 'mobile-view.png') });
  await mobile.close();

  await browser.close();
  console.log(`Screenshots written to ${path.relative(process.cwd(), OUT)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
