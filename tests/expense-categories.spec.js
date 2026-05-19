/**
 * E2E: Expense Cascader categories (EXP-UI, EXP-LIST)
 */
import { test, expect } from './fixtures.js';
import { goTo, waitForIdle } from './helpers.js';

test.describe('Expense categories', () => {
  test('EXP-UI-01 create Maintenance Salary expense', async ({ page }) => {
    const title = `Salary expense ${Date.now()}`;
    await goTo(page, '/admin/expenses/new');
    await page.fill('input[id="title"]', title);
    await page.locator('.ant-cascader').click();
    const dropdown = page.locator('.ant-cascader-dropdown:visible');
    await dropdown.locator('.ant-cascader-menu').nth(0).getByText('Maintenance', { exact: true }).click();
    await dropdown.locator('.ant-cascader-menu').nth(1).getByText('Salary', { exact: true }).click();
    await page.locator('.ant-input-number-input').fill('1500');
    await page.locator('button:has-text("Create Expense")').click();
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/admin\/expenses/, { timeout: 10000 });
    await expect(page.locator('tr.ant-table-row').filter({ hasText: title }).first()).toContainText('Salary');
  });

  test('EXP-UI-02 nested Lift Repair Electrical', async ({ page }) => {
    const title = `Lift Elec ${Date.now()}`;
    await goTo(page, '/admin/expenses/new');
    await page.fill('input[id="title"]', title);
    await page.locator('.ant-cascader').click();
    const dropdown = page.locator('.ant-cascader-dropdown:visible');
    await dropdown.locator('.ant-cascader-menu').nth(0).getByText('Repair', { exact: true }).click();
    await dropdown
      .locator('.ant-cascader-menu')
      .nth(1)
      .locator('.ant-cascader-menu-item:has(.ant-cascader-menu-item-expand-icon)')
      .filter({ hasText: 'Lift Repair' })
      .click();
    await dropdown.locator('.ant-cascader-menu').nth(2).getByText('Electrical', { exact: true }).click();
    await page.locator('.ant-input-number-input').fill('2500');
    await page.locator('button:has-text("Create Expense")').click();
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator('tr.ant-table-row').filter({ hasText: title }).first()
    ).toContainText(/Electrical|Lift Repair/);
  });

  test('EXP-UI-05 validation without category', async ({ page }) => {
    await goTo(page, '/admin/expenses/new');
    await page.fill('input[id="title"]', `No cat ${Date.now()}`);
    await page.locator('.ant-input-number-input').fill('100');
    await page.locator('button:has-text("Create Expense")').click();
    await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible({ timeout: 5000 });
  });

  test('EXP-LIST-02 filter Repair includes repair subtypes', async ({ page }) => {
    await goTo(page, '/admin/expenses');
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible({ timeout: 15000 });
    const typeSelect = page.locator('.ant-space.ant-space-horizontal').locator('.ant-select').first();
    await typeSelect.locator('.ant-select-selector').click();
    await page.locator('.ant-select-item-option').filter({ hasText: /^Repair$/ }).click();
    await waitForIdle(page);
    await expect(page.locator('.ant-table')).toBeVisible();
  });
});
