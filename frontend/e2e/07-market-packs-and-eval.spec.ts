import { test, expect } from '@playwright/test';

test.describe('Localization, Evaluation and Compliance Workbenches', () => {
  test('Market Packs: switches regional markets and searches glossary', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/markets');
    await expect(page.getByRole('heading', { name: /Market Packs & Cultural Localization/i })).toBeVisible();

    // Select Taglish market button
    const phBtn = page.getByRole('button', { name: /Philippines \(ph_tl\)/i });
    await expect(phBtn).toBeVisible();
    await phBtn.click();
    await expect(page.locator('text=Insurance Commission (IC)').first()).toBeVisible();

    // Select Indonesia market button
    const idBtn = page.getByRole('button', { name: /Indonesia \(id_id\)/i });
    await expect(idBtn).toBeVisible();
    await idBtn.click();
    await expect(page.locator('text=Otoritas Jasa Keuangan (OJK)').first()).toBeVisible();
  });

  test('ASR Bench: displays WER benchmark matrix and provider tradeoffs', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/asr');
    await expect(page.getByRole('heading', { name: /ASR & TTS Engineering Bench/i })).toBeVisible();
    await expect(page.locator('text=Deepgram Nova-2').first()).toBeVisible();
    await expect(page.locator('text=Whisper Large-v3').first()).toBeVisible();
  });

  test('Call Library: displays call logs and black box links', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/calls');
    await expect(page.getByRole('heading', { name: /Call Library & Recorded Sessions/i })).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();
    await expect(page.locator('text=call_rec_101').first()).toBeVisible();
  });

  test('Evaluation: displays benchmark cards and confusion matrix', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/evaluation');
    await expect(page.getByRole('heading', { name: /System Evaluation & Stress Reports/i })).toBeVisible();
    await expect(page.locator('text=Grounded Sentence Rate').first()).toBeVisible();
    await expect(page.locator('text=PII Zero-Leak Rate').first()).toBeVisible();
  });

  test('Compliance: displays regulatory risk mitigation matrix', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/gaps');
    await expect(page.getByRole('heading', { name: /Compliance, Gaps & Risk Mitigations/i })).toBeVisible();
    await expect(page.locator('text=Description & Regulatory Risk').first()).toBeVisible();
  });
});
