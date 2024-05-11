import { test, expect } from '@playwright/test';
import type HoverVideoPlayer from '../src/hover-video-player';
import { hoverOut, hoverOver } from './utils/hoverEvents';

test('hover-video-player component starts and stops playback as expected when the user hovers', async ({ context, page, isMobile }) => {
  await context.route("**/*.mp4", (route) => new Promise((resolve) => {
    // Add a .25 second delay before resolving the request for the video asset so we can
    // test that the player enters a loading state while waiting for the video to load.
    setTimeout(() => {
      resolve(route.continue());
    }, 250);
  }));
  await page.goto('/tests/playback.html');

  const hoverVideoPlayer = await page.locator("hover-video-player");
  const video = await hoverVideoPlayer.locator("video");

  await hoverVideoPlayer.evaluateHandle((el: HoverVideoPlayer) => el.addEventListener("playbackstatechange", (evt) => {
    (window as any).playbackstatechangeCalls ??= [];
    if (evt instanceof CustomEvent) {
      (window as any).playbackstatechangeCalls.push(evt.detail);
    }
  }));

  // The component's initial state should all be as expected; the user is not hovering and the video is not playing
  await Promise.all([
    expect(hoverVideoPlayer).toBeVisible(),
    expect(hoverVideoPlayer).not.toHaveAttribute("data-is-hovering", ""),
    expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "paused"),
    expect(video).toHaveJSProperty("paused", true),
  ]);

  await hoverOver(hoverVideoPlayer, isMobile);

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
  hoverOut(hoverVideoPlayer, isMobile);

  // The component's state should be updated to show that the user is no longer hovering and the video is paused again
  await Promise.all([
    expect(video).toHaveJSProperty("paused", true),
    expect(hoverVideoPlayer).not.toHaveAttribute("data-is-hovering", ""),
    expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "paused"),
  ]);

  const playbackStateChangeCalls = await page.evaluate(() => (window as any).playbackstatechangeCalls);

  await expect(playbackStateChangeCalls).toEqual([
    "loading",
    "playing",
    "paused",
  ]);
});