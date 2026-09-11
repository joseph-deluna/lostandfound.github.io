import { test, expect } from '@playwright/test';
async function visit(page, path) { await page.goto('#/' + path); }
async function addItem(page) {
  await visit(page, 'add-item');
  for (const [label, value] of [['Item Name', 'Blue umbrella'], ['Location Found', 'Library'], ['Surrendered By', 'Demo visitor'], ['Description', 'Blue canopy']]) await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByLabel('Image or PDF (optional)').setInputFiles({ name: 'demo.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 demo') });
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Blue umbrella', exact: true })).toBeVisible();
}
test('inventory CRUD, attachment persistence, search, cancel/delete, route refresh', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await addItem(page); await page.reload();
  await expect(page.getByRole('link', { name: 'Download demo.pdf' })).toBeVisible();
  await page.getByLabel('Search records').fill('missing'); await expect(page.getByText('No matching records')).toBeVisible();
  await page.getByLabel('Search records').fill(''); await page.getByRole('link', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Item Name', { exact: true }).fill('Green umbrella'); await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('cell', { name: 'Green umbrella', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Resolve', exact: true }).click(); await page.getByLabel('Filter by status').selectOption('resolved');
  await expect(page.getByRole('cell', { name: 'Resolved', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).click(); await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Green umbrella', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).click(); await page.getByRole('button', { name: 'Delete record', exact: true }).click();
  await expect(page.getByText('No inventory items yet')).toBeVisible(); await page.reload(); await expect(page.getByText('No inventory items yet')).toBeVisible();
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('reports CRUD, validation, matching and dashboard counts', async ({ page }) => {
  await addItem(page); await visit(page, 'report');
  for (const [label, value] of [['Item Name', 'Umbrella'], ['Location Lost', 'Library'], ['Date Lost', '2025-01-01'], ['First Name', 'Demo'], ['Last Name', 'Visitor'], ['Contact Number', 'bad'], ['Email', 'demo@example.test'], ['Description', '<script>alert(1)</script>Blue']]) await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole('button', { name: 'Submit', exact: true }).click(); await expect(page.getByRole('alert')).toContainText('contact number');
  await page.getByLabel('Contact Number', { exact: true }).fill('09000000000'); await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Umbrella', exact: true })).toBeVisible(); await page.reload();
  await expect(page.getByRole('cell', { name: '<script>alert(1)</script>Blue', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Edit', exact: true }).click(); await page.getByLabel('Description', { exact: true }).fill('Blue'); await page.getByRole('button', { name: 'Save changes' }).click();
  await visit(page, 'matches'); await expect(page.getByRole('heading', { name: 'Lost: Umbrella' })).toBeVisible();
  await visit(page, 'dashboard'); await expect(page.locator('.info-box h3')).toHaveText(['1', '1', '1']);
  await visit(page, 'reports'); await page.getByRole('button', { name: 'Delete', exact: true }).click(); await page.getByRole('button', { name: 'Delete record', exact: true }).click();
  await expect(page.getByText('No reports yet')).toBeVisible();
});
test('local profiles register/sign-in/sign-out; responsive navigation works', async ({ page }) => {
  await visit(page, 'register');
  await page.getByLabel('ID Number / Username').fill('Demo'); await page.getByLabel('Password', { exact: true }).fill('demo-password'); await page.getByLabel('Confirm Password').fill('demo-password');
  await page.getByRole('button', { name: 'Register', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible();
  await page.getByLabel('ID Number / Username').fill('Demo'); await page.getByLabel('Password', { exact: true }).fill('demo-password'); await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible(); await page.reload(); await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  if (await page.getByRole('button', { name: 'Toggle navigation' }).isVisible()) await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.getByRole('link', { name: 'Inventory', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Inventory', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click(); await expect(page.getByText('Demo visitor', { exact: true })).toBeVisible();
});
test('corrupted and future data are handled without a blank screen', async ({ page }) => {
  await page.goto(''); await page.evaluate(() => localStorage.setItem('uc-lost-found:records', '{broken')); await page.reload();
  await expect(page.getByText('Damaged browser data', { exact: false })).toBeVisible();
  await page.evaluate(() => localStorage.setItem('uc-lost-found:records', '{"version":99}')); await page.reload();
  await expect(page.getByRole('heading', { name: 'Workspace unavailable' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('uc-lost-found:records'))).toBe('{"version":99}');
});
test('closed confirmation stays hidden and skip link preserves the route', async ({ page }) => {
  await visit(page, 'dashboard');
  await expect(page.locator('#confirmation')).toBeHidden();
  await page.keyboard.press('Tab');
  await page.getByRole('link', { name: 'Skip to content' }).press('Enter');
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await expect(page.locator('#main')).toBeFocused();
  await page.screenshot({ path: `test-results/dashboard-${test.info().project.name}.png`, fullPage: true });
  await visit(page, 'report');
  await page.screenshot({ path: `test-results/report-${test.info().project.name}.png`, fullPage: true });
});
test('denied localStorage shows a helpful error', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Denied', 'SecurityError'); } }); });
  await page.goto('');
  await expect(page.getByRole('heading', { name: 'Workspace unavailable' })).toBeVisible();
  await expect(page.getByText('Browser storage is unavailable.', { exact: false })).toBeVisible();
});
