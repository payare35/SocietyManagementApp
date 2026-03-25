/**
 * E2E: member with comma-separated flats gets maintenance × flat count when dues are generated.
 */
import { test, expect } from './fixtures.js';

const UNIQUE_CONTACT = `77${Date.now().toString().slice(-8)}`;

function formatInr(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

async function goTo(page, path) {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
}

async function waitForIdle(page) {
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
}

test.describe('Multi-flat maintenance dues', () => {
  test('due amount equals monthly maintenance × number of flats', async ({ page }) => {
    // 1) Read configured monthly maintenance from Settings
    await goTo(page, '/admin/settings');
    await expect(page.locator('text=Society Settings')).toBeVisible({ timeout: 15000 });
    await waitForIdle(page);

    const maintInput = page.locator('#monthlyMaintenanceAmount');
    await expect(maintInput).toBeVisible({ timeout: 10000 });
    const maintRaw = await maintInput.inputValue();
    const base = parseFloat(String(maintRaw).replace(/[^\d.]/g, ''), 10);
    expect(base).toBeGreaterThan(0);

    const memberName = `MultiFlat ${Date.now()}`;
    const expectedDue = formatInr(base * 2);

    // 2) Create member with two flats
    await goTo(page, '/admin/members/new');
    await page.fill('input[id="name"]', memberName);
    await page.fill('input[id="flatNumber"]', '501, 502');
    await page.fill('input[id="contactNumber"]', UNIQUE_CONTACT);
    await page.fill('input[id="password"]', 'MultiFlat@123');
    await page.locator('button:has-text("Create Member")').click();
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(/admin\/members$/, { timeout: 10000 });

    // 3) Generate dues for current month (only past/current allowed in UI)
    await goTo(page, '/admin/dues');
    await expect(page.locator('button:has-text("Generate Dues")')).toBeVisible({ timeout: 12000 });
    await page.locator('button:has-text("Generate Dues")').click();
    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    await modal.locator('.ant-picker').click();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const label = months[new Date().getMonth()];
    await page
      .locator('.ant-picker-dropdown')
      .locator('.ant-picker-month-panel .ant-picker-cell-inner')
      .filter({ hasText: new RegExp(`^${label}$`) })
      .first()
      .click();
    await page.waitForTimeout(200);

    await modal.locator('button:has-text("Generate")').click();
    await expect(
      page.locator('.ant-message-success, .ant-message-info, .ant-message-warning, .ant-message-error').first()
    ).toBeVisible({ timeout: 20000 });

    // 4) Filter dues table by current month and find this member’s row
    await page.getByPlaceholder('Filter by month').click();
    await page
      .locator('.ant-picker-dropdown')
      .locator('.ant-picker-month-panel .ant-picker-cell-inner')
      .filter({ hasText: new RegExp(`^${label}$`) })
      .first()
      .click();
    await waitForIdle(page);

    const row = page.locator('tr.ant-table-row').filter({ hasText: memberName });
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row).toContainText('501, 502');
    await expect(row.getByRole('cell').filter({ hasText: expectedDue })).toBeVisible();
  });
});
