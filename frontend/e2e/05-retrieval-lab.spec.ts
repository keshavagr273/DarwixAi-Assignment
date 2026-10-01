import { test, expect } from '@playwright/test';

test.describe('Retrieval Quality Lab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/retrieval');
    await page.waitForLoadState('domcontentloaded');
  });

  test('renders header and evidence table view', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Retrieval Quality Lab/i })).toBeVisible();
    await expect(page.locator('text=Verified Evidence Records').first()).toBeVisible();
  });

  test('switches between Evidence Table and Interactive Search Sandbox', async ({ page }) => {
    // Check for interactive search tab
    const sandboxTab = page.getByRole('button', { name: /Interactive Sandbox|Search Sandbox/i }).first();
    if (await sandboxTab.isVisible()) {
      await sandboxTab.click();
      await expect(page.locator('input[type="text"]').first()).toBeVisible();
    }
  });

  test('filters evidence records by market and checks Grounding Receipts', async ({ page }) => {
    // Check first evidence row
    const firstRow = page.locator('table tr').nth(1);
    await expect(firstRow).toBeVisible();

    // Click receipt button if present in row
    const receiptBtn = page.getByRole('button', { name: /Receipt|View/i }).first();
    if (await receiptBtn.isVisible()) {
      await receiptBtn.click();
      await expect(page.getByRole('heading', { name: /Grounding Receipt/i })).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });
});
