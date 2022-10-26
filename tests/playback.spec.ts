import { test, expect } from '@playwright/test';

test('hover-video-player component starts and stops playback as expected when the user hovers', async ({ page, isMobile }) => {
  await page.route("**/*.mp4", (route) => new Promise((resolve) => {
    // Add a .25 second delay before resolving the request for the video asset so we can
    // test that the player enters a loading state while waiting for the video to load.
    setTimeout(() => resolve(route.continue()), 250);
  }));
  await page.goto('/tests/playback.html');

  const hoverVideoPlayer = await page.locator("hover-video-player");
  const video = await page.locator("hover-video-player video");

  // The component's initial state should all be as expected; the user is not hovering and the video is not playing
  await Promise.all([
    expect(hoverVideoPlayer).toBeVisible(),
    expect(hoverVideoPlayer).not.toHaveAttribute("data-is-hovering", ""),
    expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "paused"),
    expect(video).toHaveJSProperty("paused", true),
  ]);

  // Mouse over or tap the video player depending on if this is a touch device to start playback
  if (isMobile) {
    // Using dispatchEvent instead of tap() because tap gets a little flaky on the iPhone browser for some reason
    await hoverVideoPlayer.dispatchEvent("touchstart");
  } else {
    await hoverVideoPlayer.hover();
  }

  // The component's attributes should be updated to show that the user is hovering and the video is loading
  await Promise.all([
    expect(hoverVideoPlayer).toHaveAttribute("data-is-hovering", ""),
    expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "loading"),
  ]);

  // The video should finish loading and start playing
  await Promise.all([
    expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "playing"),
    expect(video).toHaveJSProperty("paused", false),
  ]);

  // Mouse out or tap outside of the player to stop playback
  if (isMobile) {
    await page.dispatchEvent("body", "touchstart");
  } else {
    await page.mouse.move(0, 0);
  }

  // The component's state should be updated to show that the user is no longer hovering and the video is paused again
  await Promise.all([
    expect(video).toHaveJSProperty("paused", true),
    expect(hoverVideoPlayer).not.toHaveAttribute("data-is-hovering", ""),
    expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "paused"),
  ]);
});