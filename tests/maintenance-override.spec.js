/**
 * E2E: Per-member maintenance override (MNT-DUE-01–03)
 */
import { test, expect } from './fixtures.js';
import {
  goTo,
  waitForIdle,
  generateDuesForCurrentMonth,
  filterDuesByCurrentMonth,
  readSocietyMaintenanceAmount,
  formatInr,
} from './helpers.js';

const UNIQUE_CONTACT = `99${Date.now().toString().slice(-8)}`;

test.describe('Maintenance override', () => {
  test('MNT-DUE-01 shop member uses override rate', async ({ page }) => {
    const base = await readSocietyMaintenanceAmount(page);
    const override = Math.max(100, Math.floor(base / 3));
    const memberName = `ShopOverride ${Date.now()}`;

    await goTo(page, '/admin/members/new');
    await page.fill('input[id="name"]', memberName);
    await page.fill('input[id="flatNumber"]', 'Shop');
    await page.fill('input[id="contactNumber"]', UNIQUE_CONTACT);
    await page.fill('input[id="password"]', 'ShopOverride@123');
    await page.locator('#monthlyMaintenanceAmount').fill(String(override));
    await page.locator('button:has-text("Create Member")').click();
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 20000 });

    await generateDuesForCurrentMonth(page);
    await filterDuesByCurrentMonth(page);

    const row = page.locator('tr.ant-table-row').filter({ hasText: memberName });
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row).toContainText(formatInr(override));
    await expect(row.getByRole('cell').filter({ hasText: formatInr(override) }).first()).toBeVisible();
  });

  test('MNT-DUE-03 override times flat count', async ({ page }) => {
    const override = 600;
    const memberName = `ShopMulti ${Date.now()}`;
    const contact = `66${Date.now().toString().slice(-8)}`;

    await goTo(page, '/admin/members/new');
    await page.fill('input[id="name"]', memberName);
    await page.fill('input[id="flatNumber"]', 'G1, G2');
    await page.fill('input[id="contactNumber"]', contact);
    await page.fill('input[id="password"]', 'ShopMulti@123');
    await page.locator('#monthlyMaintenanceAmount').fill(String(override));
    await page.locator('button:has-text("Create Member")').click();
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 20000 });

    await generateDuesForCurrentMonth(page);
    await filterDuesByCurrentMonth(page);

    const row = page.locator('tr.ant-table-row').filter({ hasText: memberName });
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row.getByRole('cell').filter({ hasText: formatInr(override * 2) })).toBeVisible();
  });
});
