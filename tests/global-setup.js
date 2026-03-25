import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ADMIN_EMAIL = 'payare35@gmail.com';
const ADMIN_PASSWORD = 'Prathamesh@12';

export default async function globalSetup() {
  const authDir = path.join(process.cwd(), 'tests/.auth');
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:5173/login');
  await page.waitForSelector('input#identifier', { timeout: 15000 });
  await page.fill('input#identifier', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 });

  // Save the authenticated browser state (cookies + localStorage)
  await page.context().storageState({ path: path.join(authDir, 'admin.json') });
  await browser.close();

  console.log('✓ Global setup: admin session saved to tests/.auth/admin.json');
}
