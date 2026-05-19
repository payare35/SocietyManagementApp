import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { getAdminCustomToken } from './auth-token.mjs';

const BASE = process.env.E2E_BASE_URL || 'http://localhost:5173';

export default async function globalSetup() {
  const authDir = path.join(process.cwd(), 'tests/.auth');
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const customToken = await getAdminCustomToken();
    await page.goto(`${BASE}/e2e-auth?customToken=${encodeURIComponent(customToken)}`);
    await page.waitForURL((url) => url.pathname.includes('/admin/dashboard'), { timeout: 45000 });
    await page.context().storageState({ path: path.join(authDir, 'admin.json') });
    console.log('✓ Global setup: admin session saved via E2E auth bridge');
  } catch (err) {
    console.warn(`⚠ Global setup failed: ${err.message}`);
  } finally {
    await browser.close();
  }
}
