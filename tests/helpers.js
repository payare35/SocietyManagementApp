import { getAdminCustomToken } from './auth-token.mjs';

const BASE = process.env.E2E_BASE_URL || 'http://localhost:5173';

export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export async function loginAsAdmin(page) {
  const customToken = await getAdminCustomToken();
  await page.goto(`${BASE}/e2e-auth?customToken=${encodeURIComponent(customToken)}`);
  await page.waitForURL((url) => url.pathname.includes('/admin/dashboard'), { timeout: 45000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
}

export function formatInr(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function currentMonthLabel() {
  return MONTH_LABELS[new Date().getMonth()];
}

export async function goTo(page, path) {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
  if (page.url().includes('/login')) {
    await loginAsAdmin(page);
    await page.goto(path);
    await page.waitForLoadState('domcontentloaded');
  }
}

export async function waitForIdle(page) {
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
}

export async function pickCurrentMonthInPicker(page) {
  const label = currentMonthLabel();
  await page
    .locator('.ant-picker-dropdown:visible')
    .locator('.ant-picker-month-panel .ant-picker-cell-inner')
    .filter({ hasText: new RegExp(`^${label}$`) })
    .first()
    .click();
}

export async function generateDuesForCurrentMonth(page) {
  await goTo(page, '/admin/dues');
  await page.locator('button:has-text("Generate Dues")').click();
  const modal = page.locator('.ant-modal').filter({ hasText: 'Generate Dues' });
  await modal.locator('.ant-picker').click();
  await pickCurrentMonthInPicker(page);
  await page.waitForTimeout(200);
  await modal.locator('button:has-text("Generate")').click();
  await page
    .locator('.ant-message-success, .ant-message-info, .ant-message-warning, .ant-message-error')
    .first()
    .waitFor({ state: 'visible', timeout: 20000 });
}

export async function filterDuesByCurrentMonth(page) {
  await page.getByPlaceholder('Filter by month').click();
  await pickCurrentMonthInPicker(page);
  await waitForIdle(page);
}

export async function readSocietyMaintenanceAmount(page) {
  await goTo(page, '/admin/settings');
  await page.getByRole('heading', { name: 'Society Settings' }).waitFor({ state: 'visible', timeout: 20000 });
  await waitForIdle(page);
  const raw = await page.locator('#monthlyMaintenanceAmount').inputValue();
  const base = parseFloat(String(raw).replace(/[^\d.]/g, ''), 10);
  if (!base || base <= 0) throw new Error('Invalid society maintenance amount in settings');
  return base;
}
