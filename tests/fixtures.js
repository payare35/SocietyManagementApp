/**
 * Custom Playwright fixtures.
 *
 * `authedContext`  — worker-scoped: created once per worker, performs login once.
 *                    Firebase stores the ID token in IndexedDB inside this context.
 * `page`           — test-scoped: each test gets a new page from the shared context,
 *                    so Firebase auth state (IndexedDB) is already present.
 */
import { test as base, expect } from '@playwright/test';

const EMAIL    = 'payare35@gmail.com';
const PASSWORD = 'Prathamesh@12';
const BASE     = 'http://localhost:5173';

export const test = base.extend({
  // One authenticated browser context shared across all tests in the worker
  authedContext: [
    async ({ browser }, use) => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });

      const setupPage = await context.newPage();
      await setupPage.goto(`${BASE}/login`);
      await setupPage.waitForSelector('input#identifier', { timeout: 15000 });
      await setupPage.fill('input#identifier', EMAIL);
      await setupPage.fill('input[type="password"]', PASSWORD);
      await setupPage.click('button[type="submit"]');
      await setupPage.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 20000 });
      await setupPage.close();

      await use(context);
      await context.close();
    },
    { scope: 'worker' },
  ],

  // Each test gets a fresh page from the shared authenticated context
  page: async ({ authedContext }, use) => {
    const page = await authedContext.newPage();
    await use(page);
    await page.close();
  },
});

export { expect };
