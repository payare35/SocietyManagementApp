/**
 * Playwright fixtures — admin auth via dev /e2e-auth bridge (Firebase custom token).
 */
import { test as base, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers.js';

export { loginAsAdmin };

export const test = base.extend({
  page: async ({ browser }, use) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await loginAsAdmin(page);
    await use(page);
    await context.close();
  },
});

export { expect };
