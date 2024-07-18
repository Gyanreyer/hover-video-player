
import { test, expect } from '@playwright/test';
import { hoverOut, hoverOver } from './utils/hoverEvents';
import type HoverVideoPlayer from '../src/hover-video-player';

test("custom elements which define HTMLMediaElement APIs can be used as video players", async ({ page, isMobile }) => {
  await page.goto("/tests/customElements.html");

  const hoverVideoPlayer = await page.locator("[data-testid=ce-player]");
  const videoPlayer = await hoverVideoPlayer.locator("my-player");

  await expect(hoverVideoPlayer.evaluate((el: HoverVideoPlayer, expectedVideoPlayer) => el.video === expectedVideoPlayer, await videoPlayer.elementHandle())).resolves.toBeTruthy();

  await expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "paused");

  await hoverOver(hoverVideoPlayer, isMobile);

  await expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "playing");

  await hoverOut(hoverVideoPlayer, isMobile);
});

test("slot change promise waiting for a custom element to be defined will be cancelled if another slot change happens", async ({ page }) => {
  await page.goto("/tests/customElements.html");

  const hoverVideoPlayer = await page.locator("[data-testid=cancel-waiting-for-ce-player]");

  await expect(hoverVideoPlayer.evaluate((el: HoverVideoPlayer) => el.video)).resolves.toBeNull();

  const newPlayerHandle = await hoverVideoPlayer.evaluateHandle((el: HTMLElement) => {
    const newPlayerElement = document.createElement("my-player");
    newPlayerElement.setAttribute("src", "/tests/assets/BigBuckBunny.mp4");
    newPlayerElement.setAttribute("data-testid", "new-player");
    el.appendChild(newPlayerElement);

    return newPlayerElement;
  });

  await expect(hoverVideoPlayer.evaluateHandle((el: HoverVideoPlayer, newPlayerHandle) => el.video === newPlayerHandle, newPlayerHandle)).resolves.toBeTruthy();
});

test("custom elements which do not define HTMLMediaElement APIs will not be used", async ({ page }) => {
  await page.goto("/tests/customElements.html");

  const hoverVideoPlayer = await page.locator("[data-testid=invalid-ce-player]");

  await expect(hoverVideoPlayer.evaluateHandle((el: HoverVideoPlayer) => el.video).then(h => h.asElement())).resolves.toBeNull();
});