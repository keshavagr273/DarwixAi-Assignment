import { test, expect } from '@playwright/test';

test.describe('Autonomous Voice Agent Studio', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['microphone']).catch(() => {});
    await page.addInitScript(() => {
      if (!navigator.mediaDevices) {
        (navigator as any).mediaDevices = {};
      }
      navigator.mediaDevices.getUserMedia = async () => new MediaStream();
    });
    await page.route('**/api/v1/voice/calls', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ call_session_id: 'call_test_123', status: 'connected' }),
      })
    );
    await page.route('**/api/v1/agent/sessions', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ session_id: 'agent_test_456', status: 'initialized' }),
      })
    );
    await page.route('**/api/v1/voice/calls/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ended' }),
      })
    );
    await page.route('**/api/v1/agent/sessions/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'closed' }),
      })
    );
    await page.goto('http://127.0.0.1:5173/agent');
    await page.waitForLoadState('domcontentloaded');
  });

  test('renders voice studio header and phone simulator controls', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Voice Agent Studio/i })).toBeVisible();
    await expect(page.locator('#start-call-btn')).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible(); // Live waveform visualizer
  });

  test('interacts with call controls (Start, Mute, End)', async ({ page }) => {
    const startCallBtn = page.locator('#start-call-btn');
    await expect(startCallBtn).toBeVisible();
    await startCallBtn.click();

    // After clicking start, End Call button appears
    const endCallBtn = page.locator('#end-call-btn');
    await expect(endCallBtn).toBeVisible();

    // Mute button can be toggled
    const muteBtn = page.locator('#mute-btn');
    await expect(muteBtn).toBeVisible();
    await muteBtn.click();

    // End call
    await endCallBtn.click();
    await expect(startCallBtn).toBeVisible();
  });

  test('inspects Dialogue FSM state canvas', async ({ page }) => {
    const fsmTab = page.getByRole('button', { name: /Dialogue FSM Canvas/i });
    await expect(fsmTab).toBeVisible();
    await fsmTab.click();
    await expect(page.locator('text=GREETING').first()).toBeVisible();
  });
});
