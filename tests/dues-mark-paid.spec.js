/**
 * E2E: Admin Dues — Mark Paid modal with optional comment (DUE-UI-01–08)
 */
import { test, expect } from './fixtures.js';
import {
  goTo,
  waitForIdle,
  filterDuesByCurrentMonth,
  generateDuesForCurrentMonth,
} from './helpers.js';

function uniqueContact() {
  return `88${Date.now().toString().slice(-8)}`;
}

async function createTestMember(page, name, flatNumber = '601') {
  await goTo(page, '/admin/members/new');
  await expect(page.locator('input[id="name"]')).toBeVisible({ timeout: 15000 });
  await page.fill('input[id="name"]', name);
  await page.fill('input[id="flatNumber"]', flatNumber);
  await page.fill('input[id="contactNumber"]', uniqueContact());
  await page.fill('input[id="password"]', 'MarkPaidTest@123');
  await page.locator('button:has-text("Create Member")').click();
  await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 20000 });
}

async function openMarkPaidOnMember(page, memberName) {
  await goTo(page, '/admin/dues');
  await filterDuesByCurrentMonth(page);
  const row = page.locator('tr.ant-table-row').filter({ hasText: memberName });
  await expect(row).toBeVisible({ timeout: 15000 });
  await row.locator('button:has-text("Mark Paid")').click();
  const modal = page.locator('.ant-modal').filter({ hasText: /Mark.*due as paid/i });
  await expect(modal).toBeVisible({ timeout: 5000 });
  return modal;
}

test.describe('Dues Mark Paid modal', () => {
  test('DUE-UI-01 modal has comment field', async ({ page }) => {
    const memberName = `DueModal ${Date.now()}`;
    await createTestMember(page, memberName);
    await generateDuesForCurrentMonth(page);

    const modal = await openMarkPaidOnMember(page, memberName);
    await expect(modal.getByText('Comment (Optional)')).toBeVisible();
    await expect(modal.locator('textarea')).toBeVisible();
    await expect(modal).not.toHaveClass(/ant-modal-confirm/);
    await modal.locator('button:has-text("Cancel")').click();
  });

  test('DUE-UI-02 custom comment appears in transactions', async ({ page }) => {
    const memberName = `DueComment ${Date.now()}`;
    const note = `Received cash - receipt #42 - ${Date.now()}`;
    await createTestMember(page, memberName);
    await generateDuesForCurrentMonth(page);

    const modal = await openMarkPaidOnMember(page, memberName);
    await modal.locator('textarea').fill(note);
    await modal.locator('button:has-text("Mark Paid")').click();
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 15000 });

    await goTo(page, '/admin/transactions');
    await waitForIdle(page);
    const row = page.locator('tr.ant-table-row').filter({ hasText: memberName });
    await expect(row.first()).toBeVisible({ timeout: 15000 });
    await expect(row.first()).toContainText(note);
  });

  test('DUE-UI-03 empty comment uses default note', async ({ page }) => {
    const memberName = `DueDefault ${Date.now()}`;
    await createTestMember(page, memberName);
    await generateDuesForCurrentMonth(page);

    const modal = await openMarkPaidOnMember(page, memberName);
    await modal.locator('button:has-text("Mark Paid")').click();
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 15000 });

    await goTo(page, '/admin/transactions');
    await waitForIdle(page);
    const row = page.locator('tr.ant-table-row').filter({ hasText: memberName });
    await expect(row.first()).toBeVisible({ timeout: 15000 });
    await expect(row.first()).toContainText('Marked as paid by admin');
  });

  test('DUE-UI-04 whitespace-only comment uses default', async ({ page }) => {
    const memberName = `DueWhitespace ${Date.now()}`;
    await createTestMember(page, memberName);
    await generateDuesForCurrentMonth(page);

    const modal = await openMarkPaidOnMember(page, memberName);
    await modal.locator('textarea').fill('   ');
    await modal.locator('button:has-text("Mark Paid")').click();
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 15000 });

    await goTo(page, '/admin/transactions');
    await waitForIdle(page);
    const row = page.locator('tr.ant-table-row').filter({ hasText: memberName });
    await expect(row.first()).toContainText('Marked as paid by admin');
  });

  test('DUE-UI-05 cancel leaves due unpaid', async ({ page }) => {
    const memberName = `DueCancel ${Date.now()}`;
    await createTestMember(page, memberName);
    await generateDuesForCurrentMonth(page);

    const modal = await openMarkPaidOnMember(page, memberName);
    await modal.locator('button:has-text("Cancel")').click();
    await expect(modal).not.toBeVisible();

    await goTo(page, '/admin/dues');
    await filterDuesByCurrentMonth(page);
    const row = page.locator('tr.ant-table-row').filter({ hasText: memberName });
    await expect(row.locator('button:has-text("Mark Paid")')).toBeVisible();
  });

  test('DUE-UI-07 mark paid updates due status', async ({ page }) => {
    const memberName = `DuePaidStatus ${Date.now()}`;
    await createTestMember(page, memberName);
    await generateDuesForCurrentMonth(page);

    const modal = await openMarkPaidOnMember(page, memberName);
    await modal.locator('button:has-text("Mark Paid")').click();
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 15000 });

    await goTo(page, '/admin/dues');
    await filterDuesByCurrentMonth(page);
    const row = page.locator('tr.ant-table-row').filter({ hasText: memberName });
    await expect(row).toContainText('PAID');
    await expect(row.locator('button:has-text("Mark Paid")')).toHaveCount(0);
  });

  test('DUE-UI-08 paid rows have no Mark Paid button', async ({ page }) => {
    await goTo(page, '/admin/dues');
    await filterDuesByCurrentMonth(page);
    const paidRow = page.locator('tr.ant-table-row').filter({ hasText: 'PAID' }).first();
    if (await paidRow.count() === 0) {
      test.skip();
      return;
    }
    await expect(paidRow.locator('button:has-text("Mark Paid")')).toHaveCount(0);
  });
});
