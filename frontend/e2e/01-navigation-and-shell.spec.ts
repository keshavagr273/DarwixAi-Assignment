import { test, expect } from '@playwright/test';

test.describe('Navigation and Global Shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('loads home page and renders brand identity', async ({ page }) => {
    await expect(page).toHaveTitle(/PARLEY/i);
    await expect(page.getByRole('heading', { name: /PARLEY Command Center/i })).toBeVisible();
    await expect(page.locator('text=Production Pipeline Operational').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /launch live copilot/i })).toBeVisible();
  });

  test('toggles between Mock Fixtures and Live Backend', async ({ page }) => {
    const mockBtn = page.getByRole('button', { name: /mock fixtures/i }).first();
    const liveBtn = page.getByRole('button', { name: /live backend/i }).first();

    await expect(mockBtn).toBeVisible();
    await expect(liveBtn).toBeVisible();

    await liveBtn.click();
    await expect(liveBtn).toHaveClass(/emerald/);

    await mockBtn.click();
    await expect(mockBtn).toHaveClass(/amber/);
  });

  test('opens and navigates through the Command Palette (⌘K)', async ({ page }) => {
    const searchBtn = page.getByRole('button', { name: /search records & traces/i }).first();
    await searchBtn.click();

    const searchInput = page.getByPlaceholder(/search pages, kb record ids/i);
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Live Agent');
    await expect(page.locator('text=Live Agent Copilot').first()).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(searchInput).not.toBeVisible();
  });

  test('switches market regions in top navigation', async ({ page }) => {
    const marketSelect = page.locator('select').first();
    await expect(marketSelect).toBeVisible();

    await marketSelect.selectOption({ label: '🇵🇭 Philippines (Taglish)' });
    await expect(marketSelect).toHaveValue('ph_tl');

    await marketSelect.selectOption({ label: '🇮🇳 India (English/Hindi)' });
    await expect(marketSelect).toHaveValue('in_en');
  });

  test('sidebar links navigate to all primary workbenches', async ({ page }) => {
    // Navigate to Live Copilot
    await page.click('a[href="/live"]');
    await expect(page).toHaveURL(/.*live/);
    await expect(page.getByRole('heading', { name: /Live Agent Copilot & Nudge Court/i })).toBeVisible();

    // Navigate to Knowledge Studio
    await page.click('a[href="/kb"]');
    await expect(page).toHaveURL(/.*kb/);
    await expect(page.getByRole('heading', { name: /Knowledge Base Studio/i })).toBeVisible();

    // Navigate to Retrieval Lab
    await page.click('a[href="/retrieval"]');
    await expect(page).toHaveURL(/.*retrieval/);
    await expect(page.getByRole('heading', { name: /Retrieval Quality Lab/i })).toBeVisible();

    // Navigate to Voice Studio
    await page.click('a[href="/agent"]');
    await expect(page).toHaveURL(/.*agent/);
    await expect(page.getByRole('heading', { name: /Voice Agent Studio/i })).toBeVisible();

    // Navigate to Language Packs
    await page.click('a[href="/markets"]');
    await expect(page).toHaveURL(/.*markets/);
    await expect(page.getByRole('heading', { name: /Market Packs & Cultural Localization/i })).toBeVisible();

    // Navigate to ASR Engineering
    await page.click('a[href="/asr"]');
    await expect(page).toHaveURL(/.*asr/);
    await expect(page.getByRole('heading', { name: /ASR & TTS Engineering Bench/i })).toBeVisible();

    // Navigate to Call Library
    await page.click('a[href="/calls"]');
    await expect(page).toHaveURL(/.*calls/);
    await expect(page.getByRole('heading', { name: /Call Library & Recorded Sessions/i })).toBeVisible();

    // Navigate to Evaluation
    await page.click('a[href="/evaluation"]');
    await expect(page).toHaveURL(/.*evaluation/);
    await expect(page.getByRole('heading', { name: /System Evaluation & Stress Reports/i })).toBeVisible();

    // Navigate back to Mission Control
    await page.click('a[href="/"]');
    await expect(page).toHaveURL('http://127.0.0.1:5173/');
    await expect(page.getByRole('heading', { name: /PARLEY Command Center/i })).toBeVisible();
  });
});
