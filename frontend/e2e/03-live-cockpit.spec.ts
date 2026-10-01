import { test, expect } from '@playwright/test';

test.describe('Live Agent Copilot & Nudge Court', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/live');
    await page.waitForLoadState('domcontentloaded');
  });

  test('renders top header and audio telephony status', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Live Agent Copilot & Nudge Court/i })).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible(); // Live waveform canvas
  });

  test('switches across all 4 live telephony scenarios', async ({ page }) => {
    // 1. Cross-Sell Opportunity
    const scen1Btn = page.getByRole('button', { name: /1\. Cross-Sell Opportunity/i });
    await expect(scen1Btn).toBeVisible();
    await scen1Btn.click();
    await expect(page.locator('text=POL-IN-2024-8849').first()).toBeVisible();

    // 2. Skipped Disclosure
    const scen2Btn = page.getByRole('button', { name: /2\. Skipped Disclosure/i });
    await expect(scen2Btn).toBeVisible();
    await scen2Btn.click();
    await expect(page.locator('text=POL-IN-2023-4112').first()).toBeVisible();

    // 3. Rising Frustration
    const scen3Btn = page.getByRole('button', { name: /3\. Rising Frustration/i });
    await expect(scen3Btn).toBeVisible();
    await scen3Btn.click();
    await expect(page.locator('text=POL-IN-2022-7719').first()).toBeVisible();

    // 4. Ambient Street Noise
    const scen4Btn = page.getByRole('button', { name: /4\. Ambient Street Noise/i });
    await expect(scen4Btn).toBeVisible();
    await scen4Btn.click();
    await expect(page.locator('text=POL-PH-2025-9012').first()).toBeVisible();
  });

  test('renders dual-lane transcript with Sentence Gate strip', async ({ page }) => {
    // Transcript area
    await expect(page.locator('text=Dual-Lane Streaming Transcript').first()).toBeVisible();

    // Sentence Gate Strip verification badge
    const gateBadge = page.locator('text=Sentence Gate: Verified').first();
    await expect(gateBadge).toBeVisible();

    // Citation button on sentence gate
    const citationChip = page.locator('button:has-text("kb_")').first();
    if (await citationChip.isVisible()) {
      await citationChip.click();
      await expect(page.getByRole('heading', { name: /Grounding Receipt Inspector/i })).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });

  test('allows accepting and dismissing real-time nudges', async ({ page }) => {
    // Look for active nudges section
    await expect(page.locator('text=Active Live Nudges').first()).toBeVisible();

    // Find first actionable nudge button
    const acceptBtn = page.getByRole('button', { name: 'Accept' }).first();
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
      // Should show clean state after accepting
      await expect(page.locator('text=No Pending Live Nudges').first()).toBeVisible();
    }
  });

  test('displays suppression court with reason why alerts were avoided', async ({ page }) => {
    // Look for Suppression Court section
    await expect(page.getByRole('heading', { name: /Suppression Court/i })).toBeVisible();
    await expect(page.locator('text=3 Filtered').first()).toBeVisible();
    await expect(page.locator('text=Suppressed: Grouped under higher-affinity topic').first()).toBeVisible();
  });
});
