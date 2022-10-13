import { test, expect } from '@playwright/test';

test('hover-video-player component starts and stops playback as expected when the user hovers with a mouse', async ({ page }) => {
  await page.goto('/tests/hoverEvents/index.html');

  const hoverVideoPlayer = await page.locator("hover-video-player");
  await expect(hoverVideoPlayer).toBeVisible();

  const video = await page.locator("hover-video-player video");
  await expect(video).toHaveJSProperty("paused", true);

  await hoverVideoPlayer.hover();
  await expect(video).toHaveJSProperty("paused", false);

  await page.mouse.move(0, 0);

  await expect(video).toHaveJSProperty("paused", true);
});

test.describe("tests on touch devices", () => {
  test.use({
    hasTouch: true,
  })
  test("hover-video-player component starts and stops playback as expected when the user hovers with a touch screen", async ({ page }) => {
    await page.goto('/tests/hoverEvents/index.html');

    const hoverVideoPlayer = await page.locator("hover-video-player");
    await expect(hoverVideoPlayer).toBeVisible();

    const video = await page.locator("hover-video-player video");
    await expect(video).toHaveJSProperty("paused", true);

    // Tap on the player to start playback
    await hoverVideoPlayer.tap();
    await expect(video).toHaveJSProperty("paused", false);

    // Tap outside of the player to pause again
    await page.touchscreen.tap(0, 0);

    await expect(video).toHaveJSProperty("paused", true);
  });
});