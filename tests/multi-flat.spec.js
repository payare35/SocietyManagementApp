/**
 * E2E: member with comma-separated flats gets maintenance × flat count when dues are generated.
 */
import { test, expect } from './fixtures.js';
import {
  goTo,
  waitForIdle,
  formatInr,
  generateDuesForCurrentMonth,
  filterDuesByCurrentMonth,
  readSocietyMaintenanceAmount,
} from './helpers.js';

const UNIQUE_CONTACT = `77${Date.now().toString().slice(-8)}`;

test.describe('Multi-flat maintenance dues', () => {
  test('due amount equals monthly maintenance × number of flats', async ({ page }) => {
    const base = await readSocietyMaintenanceAmount(page);
    const memberName = `MultiFlat ${Date.now()}`;
    const expectedDue = formatInr(base * 2);
    const expectedRate = formatInr(base);

    await goTo(page, '/admin/members/new');
    await expect(page.locator('input[id="name"]')).toBeVisible({ timeout: 15000 });
    await page.fill('input[id="name"]', memberName);
    await page.fill('input[id="flatNumber"]', '501, 502');
    await page.fill('input[id="contactNumber"]', UNIQUE_CONTACT);
    await page.fill('input[id="password"]', 'MultiFlat@123');
    await page.locator('button:has-text("Create Member")').click();
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(/admin\/members$/, { timeout: 10000 });

    await generateDuesForCurrentMonth(page);
    await filterDuesByCurrentMonth(page);

    const row = page.locator('tr.ant-table-row').filter({ hasText: memberName });
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row).toContainText('501, 502');
    await expect(row.getByRole('cell').filter({ hasText: expectedDue })).toBeVisible();
    await expect(row.getByRole('cell').filter({ hasText: expectedRate })).toBeVisible();
  });
});
