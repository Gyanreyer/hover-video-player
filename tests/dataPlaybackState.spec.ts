import { test, expect } from '@playwright/test';
import type HoverVideoPlayer from '../src/hover-video-player';

test("playback transitions correctly when data-playback-state attribute is manually manipulated", async ({ page }) => {
  await page.goto("/tests/dataPlaybackState.html");

  const hoverVideoPlayer = await page.locator("hover-video-player");
  const video = await page.locator("hover-video-player video");

  await expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "paused");

  await hoverVideoPlayer.evaluateHandle((el: HoverVideoPlayer) => { el.setAttribute("data-playback-state", "playing"); });
  await expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "playing");
  await expect(hoverVideoPlayer).not.toHaveAttribute("data-is-hovering", "");

  await expect(video).toHaveJSProperty("paused", false);

  await hoverVideoPlayer.evaluateHandle((el: HoverVideoPlayer) => { el.dataset.playbackState = "paused"; });
  await expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "paused");
  await expect(video).toHaveJSProperty("paused", true);

  // Setting state to "loading" will start the video as well
  await hoverVideoPlayer.evaluateHandle((el: HoverVideoPlayer) => { el.dataset.playbackState = "loading"; });
  await expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "playing");
  await expect(video).toHaveJSProperty("paused", false);

  // Removing the attribute should pause the video
  await hoverVideoPlayer.evaluateHandle((el: HoverVideoPlayer) => { el.removeAttribute("data-playback-state"); });
  await expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "paused");
  await expect(video).toHaveJSProperty("paused", true);
});
