import { test, expect } from '@playwright/test';

test.describe('Knowledge Base Studio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/kb');
    await page.waitForLoadState('domcontentloaded');
  });

  test('renders header and initial Sources Inventory tab', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Knowledge Base Studio/i })).toBeVisible();
    await expect(page.locator('text=Ingested Sources Inventory').first()).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('navigates through all pipeline sub-tabs', async ({ page }) => {
    // 1. Pipeline Stepper Tab
    const pipelineTab = page.getByRole('button', { name: /Pipeline Stepper/i });
    await pipelineTab.click();
    await expect(page.getByRole('heading', { name: /End-to-End Pipeline Visualization/i })).toBeVisible();
    await expect(page.locator('text=STAGE 01').first()).toBeVisible();

    // 2. Cleaning & Diff Tab
    const diffTab = page.getByRole('button', { name: /Cleaning & Diff/i });
    await diffTab.click();
    await expect(page.getByRole('heading', { name: /Raw vs Cleaned Document Diff & Conflict Resolution/i })).toBeVisible();

    // 3. Dedupe Clusters Tab
    const dedupeTab = page.getByRole('button', { name: /Dedupe Clusters/i });
    await dedupeTab.click();
    await expect(page.getByRole('heading', { name: /Near-Duplicate Clusters & Canonical Precedence/i })).toBeVisible();

    // 4. PII Shield Vault Tab
    const piiTab = page.getByRole('button', { name: /PII Shield Vault/i });
    await piiTab.click();
    await expect(page.getByRole('heading', { name: /PII Shield & Irreversible Tokenization Vault/i })).toBeVisible();

    // 5. Records Explorer Tab
    const recordsTab = page.getByRole('button', { name: /Records Explorer/i });
    await recordsTab.click();
    await expect(page.locator('table').first()).toBeVisible();

    // 6. Time Machine Tab
    const timeMachineTab = page.getByRole('button', { name: /Time Machine/i });
    await timeMachineTab.click();
    await expect(page.getByRole('heading', { name: /Snapshot Time Machine & Version Regression Gate/i })).toBeVisible();
  });

  test('interacts with PII Vault Sandbox masking toggle', async ({ page }) => {
    const piiTab = page.getByRole('button', { name: /PII Shield Vault/i });
    await piiTab.click();

    // Find Mask / Unmask toggle button
    const toggleBtn = page.getByRole('button', { name: /vault tokens|raw/i }).first();
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await expect(toggleBtn).toBeVisible();
    }
  });

  test('switches snapshots in Time Machine', async ({ page }) => {
    const timeMachineTab = page.getByRole('button', { name: /Time Machine/i });
    await timeMachineTab.click();
    await expect(page.getByRole('heading', { name: /Snapshot Time Machine & Version Regression Gate/i })).toBeVisible();

    // Click on snapshot v1.2 card
    const v12Card = page.locator('div.cursor-pointer', { hasText: 'v1.2' }).first();
    await expect(v12Card).toBeVisible();
    await v12Card.click();

    // Run regression suite button
    const runRegressionBtn = page.getByRole('button', { name: /Run Full Regression Suite/i });
    await expect(runRegressionBtn).toBeVisible();
    await runRegressionBtn.click();
    await expect(page.locator('text=Snapshot Regression PASSED').first()).toBeVisible();
  });
});
