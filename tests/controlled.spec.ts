import { test, expect } from '@playwright/test';
import type HoverVideoPlayer from '../src/hover-video-player';

test("hover and blur methods control playback as expected", async ({ page }) => {
  await page.goto("/tests/controlled.html");

  const hoverVideoPlayer = await page.locator("hover-video-player");
  const video = await page.locator("hover-video-player video");

  await expect(hoverVideoPlayer).toHaveJSProperty("controlled", true);

  // Hover interactions are ignored
  await hoverVideoPlayer.hover();
  await Promise.all([
    expect(hoverVideoPlayer).not.toHaveAttribute("data-is-hovering", ""),
    expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "paused"),
    expect(video).toHaveJSProperty("paused", true),
  ]);

  // Call the controlled hover() method to start playback
  await hoverVideoPlayer.evaluateHandle((el: HoverVideoPlayer) => el.hover());

  // The component's attributes should be updated to show that the user is hovering and the video is loading
  await Promise.all([
    expect(hoverVideoPlayer).toHaveAttribute("data-is-hovering", ""),
    expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "playing"),
  ]);

  // Blur events should also be ignored
  await page.mouse.move(0, 0);

  await Promise.all([
    expect(hoverVideoPlayer).toHaveAttribute("data-is-hovering", ""),
    expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "playing"),
  ]);

  // Call the controlled blur() method to stop playback
  await hoverVideoPlayer.evaluateHandle((el: HoverVideoPlayer) => el.blur());

  // The component's state should be updated to show that the user is no longer hovering and the video is paused again
  await Promise.all([
    expect(video).toHaveJSProperty("paused", true),
    expect(hoverVideoPlayer).not.toHaveAttribute("data-is-hovering", ""),
    expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "paused"),
  ]);
});

test("existing event listeners are disabled/re-enabled if the component's controlled state changes", async ({ page }) => {
  await page.goto("/tests/controlled.html");

  const hoverVideoPlayer = await page.locator("hover-video-player");

  // Hover interactions are ignored when controlled
  await expect(hoverVideoPlayer).toHaveJSProperty("controlled", true);
  await hoverVideoPlayer.hover();
  await Promise.all([
    expect(hoverVideoPlayer).not.toHaveAttribute("data-is-hovering", ""),
    expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "paused"),
  ]);

  // Move mouse away so we can try and hover again
  await page.mouse.move(0, 0);

  // Disabling the controlled state should allow hover interactions to control playback again
  await hoverVideoPlayer.evaluateHandle((el: HoverVideoPlayer) => { el.controlled = false });
  await hoverVideoPlayer.hover();
  await Promise.all([
    expect(hoverVideoPlayer).toHaveAttribute("data-is-hovering", ""),
    expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "playing"),
  ]);

  // Mouse out is ignored when controlled again
  await hoverVideoPlayer.evaluateHandle((el: HoverVideoPlayer) => { el.controlled = true });
  await page.mouse.move(0, 0);
  await Promise.all([
    expect(hoverVideoPlayer).toHaveAttribute("data-is-hovering", ""),
    expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "playing"),
  ]);

  // Hover again so we can disable controlled state and hover back out
  await hoverVideoPlayer.hover();
  await hoverVideoPlayer.evaluateHandle((el: HoverVideoPlayer) => { el.controlled = false });
  await page.mouse.move(0, 0);
  await Promise.all([
    expect(hoverVideoPlayer).not.toHaveAttribute("data-is-hovering", ""),
    expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "paused"),
  ]);
});

test("controlled attribute is disabled with 'false' value", async ({ page }) => {
  await page.goto("/tests/controlled.html");

  const hoverVideoPlayer = await page.locator("hover-video-player");

  await expect(hoverVideoPlayer).toHaveAttribute("controlled", "");
  await expect(hoverVideoPlayer).toHaveJSProperty("controlled", true);

  await hoverVideoPlayer.evaluateHandle((el: HoverVideoPlayer) => { el.setAttribute("controlled", "false") });

  // The controlled attribute is set, but its value is "false" so it's disabled
  await expect(hoverVideoPlayer).toHaveJSProperty("controlled", false);

  await hoverVideoPlayer.hover();

  // The component's attributes should be updated to show that the user is hovering and the video is loading
  await Promise.all([
    expect(hoverVideoPlayer).toHaveAttribute("data-is-hovering", ""),
    expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "playing"),
  ]);

  await page.mouse.move(0, 0);

  await Promise.all([
    expect(hoverVideoPlayer).not.toHaveAttribute("data-is-hovering", ""),
    expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "paused"),
  ]);
});
