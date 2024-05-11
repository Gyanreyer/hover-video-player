import { test, expect } from '@playwright/test';
import { hoverOut, hoverOver } from './utils/hoverEvents';

test("restartOnPause causes the video to reset to the beginning when paused", async ({ page, isMobile }) => {
    await page.goto("/tests/restartOnPause.html");

    const hoverVideoPlayer = await page.locator("hover-video-player");
    const video = await hoverVideoPlayer.locator("video");

    await expect(hoverVideoPlayer).toHaveAttribute("restart-on-pause", "");
    await expect(hoverVideoPlayer).toHaveJSProperty("restartOnPause", true);

    await expect(video).toHaveJSProperty("currentTime", 0);

    await hoverOver(hoverVideoPlayer, isMobile);

    await expect(video).toHaveJSProperty("paused", false);
    await expect(video).not.toHaveJSProperty("currentTime", 0);

    await hoverOut(hoverVideoPlayer, isMobile);

    await expect(video).toHaveJSProperty("currentTime", 0);

    await hoverVideoPlayer.evaluate((_hoverVideoPlayer: HTMLElement & { restartOnPause: boolean }) => {
        _hoverVideoPlayer.restartOnPause = false;
    });

    await expect(hoverVideoPlayer).not.toHaveAttribute("restart-on-pause", "");
    await expect(hoverVideoPlayer).toHaveJSProperty("restartOnPause", false);

    await hoverOver(hoverVideoPlayer, isMobile);

    await expect(video).not.toHaveJSProperty("currentTime", 0);

    await hoverOut(hoverVideoPlayer, isMobile);

    await expect(video).not.toHaveJSProperty("currentTime", 0);

    await hoverVideoPlayer.evaluate((_hoverVideoPlayer: HTMLElement & { restartOnPause: boolean }) => {
        _hoverVideoPlayer.restartOnPause = true;
    });

    await expect(hoverVideoPlayer).toHaveAttribute("restart-on-pause", "true");
    await expect(hoverVideoPlayer).toHaveJSProperty("restartOnPause", true);
});