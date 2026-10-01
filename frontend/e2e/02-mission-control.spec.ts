import { test, expect } from '@playwright/test';

test.describe('Mission Control Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('displays all 4 core product module cards with operational metrics', async ({ page }) => {
    // 1. Autonomous Voice Agent
    await expect(page.getByRole('heading', { name: 'Autonomous Voice Agent' })).toBeVisible();
    await expect(page.locator('text=96.4%').first()).toBeVisible();
    await expect(page.locator('text=Grounded Answer Rate').first()).toBeVisible();

    // 2. Knowledge Engine & PII Vault
    await expect(page.getByRole('heading', { name: 'Knowledge Engine & PII Vault' })).toBeVisible();
    await expect(page.locator('text=412 Records').first()).toBeVisible();
    await expect(page.locator('text=0 PII Leaks (100% Shielded)').first()).toBeVisible();

    // 3. Multilingual Localization
    await expect(page.getByRole('heading', { name: 'Multilingual Localization' })).toBeVisible();
    await expect(page.locator('text=3 Markets').first()).toBeVisible();
    await expect(page.locator('text=Zero English Drift').first()).toBeVisible();

    // 4. Live Copilot & Nudge Court
    await expect(page.getByRole('heading', { name: 'Live Copilot & Nudge Court' })).toBeVisible();
    await expect(page.locator('text=81.2%').first()).toBeVisible();
    await expect(page.locator('text=Precision (14 Suppressed)').first()).toBeVisible();
  });

  test('displays pipeline latency telemetry breakdown', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /End-to-End Pipeline Latency Telemetry/i })).toBeVisible();
    await expect(page.locator('text=VAD (Silero)').first()).toBeVisible();
    await expect(page.locator('text=ASR (Deepgram)').first()).toBeVisible();
    await expect(page.locator('text=Hybrid RAG Search').first()).toBeVisible();
    await expect(page.locator('text=LLM Generation').first()).toBeVisible();
    await expect(page.locator('text=Sentence Gate').first()).toBeVisible();
    await expect(page.locator('text=TTS Audio Out').first()).toBeVisible();
  });

  test('displays fail-closed refusals ledger and opens Grounding Receipt drawer', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Fail-Closed Refusals & Hallucination Prevention Ledger/i })).toBeVisible();

    // Look for first receipt button in the refusals table
    const receiptBtn = page.getByRole('button', { name: 'Receipt' }).first();
    await expect(receiptBtn).toBeVisible();
    await receiptBtn.click();

    // Verify Grounding Receipt drawer opens with citation details
    await expect(page.getByRole('heading', { name: /Grounding Receipt Inspector/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Retrieved Canonical Chunk/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Multi-Stage Retrieval Score Breakdown/i })).toBeVisible();

    // Close the receipt drawer
    const closeBtn = page.getByRole('button', { name: /close inspector/i });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(page.getByRole('heading', { name: /Grounding Receipt Inspector/i })).not.toBeVisible();
  });

  test('quick action buttons navigate to respective workbenches', async ({ page }) => {
    const launchCopilotBtn = page.getByRole('button', { name: /launch live copilot/i });
    await expect(launchCopilotBtn).toBeVisible();
    await launchCopilotBtn.click();
    await expect(page).toHaveURL(/.*live/);
  });
});
