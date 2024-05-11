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

test("hover events don't update playback state if the component's controlled state changes", async ({ page }) => {
  await page.goto("/tests/controlled.html");

  const hoverVideoPlayer = await page.locator("hover-video-player");

  hoverVideoPlayer.evaluateHandle((el: HoverVideoPlayer) => {
    (window as any).hoverStartCount = 0;
    (window as any).hoverEndCount = 0;

    el.addEventListener("hoverstart", () => {
      (window as any).hoverStartCount++;
    });
    el.addEventListener("hoverend", () => {
      (window as any).hoverEndCount++;
    });
  });

  // Hover interactions are ignored when controlled
  await expect(hoverVideoPlayer).toHaveJSProperty("controlled", true);
  await hoverVideoPlayer.hover();
  await Promise.all([
    // The hover/playback state should not be updated, but the hoverstart event did run
    expect(hoverVideoPlayer).not.toHaveAttribute("data-is-hovering", ""),
    expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "paused"),
    expect(await page.evaluate(() => (window as any).hoverStartCount)).toBe(1),
    expect(await page.evaluate(() => (window as any).hoverEndCount)).toBe(0),
  ]);

  // Move mouse away so we can try and hover again
  await page.mouse.move(0, 0);

  await Promise.all([
    expect(await page.evaluate(() => (window as any).hoverStartCount)).toBe(1),
    expect(await page.evaluate(() => (window as any).hoverEndCount)).toBe(1),
  ]);

  // Disabling the controlled state should allow hover interactions to control playback again
  await hoverVideoPlayer.evaluateHandle((el: HoverVideoPlayer) => { el.controlled = false });
  await hoverVideoPlayer.hover();
  await Promise.all([
    expect(hoverVideoPlayer).toHaveAttribute("data-is-hovering", ""),
    expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "playing"),
    expect(await page.evaluate(() => (window as any).hoverStartCount)).toBe(2),
    expect(await page.evaluate(() => (window as any).hoverEndCount)).toBe(1),
  ]);

  // Mouse out is ignored when controlled again
  await hoverVideoPlayer.evaluateHandle((el: HoverVideoPlayer) => { el.controlled = true });
  await page.mouse.move(0, 0);
  await Promise.all([
    expect(hoverVideoPlayer).toHaveAttribute("data-is-hovering", ""),
    expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "playing"),
    expect(await page.evaluate(() => (window as any).hoverStartCount)).toBe(2),
    expect(await page.evaluate(() => (window as any).hoverEndCount)).toBe(2),
  ]);

  // Hover again so we can disable controlled state and hover back out
  await hoverVideoPlayer.hover();

  await Promise.all([
    expect(await page.evaluate(() => (window as any).hoverStartCount)).toBe(3),
    expect(await page.evaluate(() => (window as any).hoverEndCount)).toBe(2),
  ]);

  await hoverVideoPlayer.evaluateHandle((el: HoverVideoPlayer) => { el.controlled = false });
  await page.mouse.move(0, 0);
  await Promise.all([
    expect(hoverVideoPlayer).not.toHaveAttribute("data-is-hovering", ""),
    expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "paused"),
    expect(await page.evaluate(() => (window as any).hoverStartCount)).toBe(3),
    expect(await page.evaluate(() => (window as any).hoverEndCount)).toBe(3),
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
