import { test, expect } from '@playwright/test';
import { hoverOut, hoverOver } from './utils/hoverEvents';

test("playback-start-delay attribute works as expected", async ({ page, isMobile }) => {
    await page.goto('/tests/playbackStartDelay.html');

    const hoverVideoPlayer = await page.locator("hover-video-player");
    const video = await hoverVideoPlayer.locator("video");

    await Promise.all([
        expect(hoverVideoPlayer).toHaveAttribute("playback-start-delay", "300"),
        expect(hoverVideoPlayer).toHaveJSProperty("playbackStartDelay", 300),
    ]);

    await hoverOver(hoverVideoPlayer, isMobile);
    await expect(video, "the video should still be paused").toHaveJSProperty("paused", true);
    await page.waitForTimeout(300);

    await expect(video, "the video should be playing now").toHaveJSProperty("paused", false);

    await hoverOut(hoverVideoPlayer, isMobile);
    await expect(video).toHaveJSProperty("paused", true);

    await hoverVideoPlayer.evaluate((_hoverVideoPlayer: HTMLElement & { playbackStartDelay: number }) => {
        _hoverVideoPlayer.playbackStartDelay = 500;
    });

    await expect(hoverVideoPlayer).toHaveAttribute("playback-start-delay", "500");

    await hoverOver(hoverVideoPlayer, isMobile);
    await expect(video, "the video should still be paused").toHaveJSProperty("paused", true);
    await page.waitForTimeout(500);

    await expect(video, "the video should be playing now").toHaveJSProperty("paused", false);

    await hoverOut(hoverVideoPlayer, isMobile);
    await expect(video).toHaveJSProperty("paused", true);

    await hoverVideoPlayer.evaluate((_hoverVideoPlayer: HTMLElement & { playbackStartDelay: number }) => {
        _hoverVideoPlayer.setAttribute("playback-start-delay", "0.55s");
    });

    await expect(hoverVideoPlayer).toHaveJSProperty("playbackStartDelay", 550);

    await expect(video).toHaveJSProperty("paused", true);

    await hoverVideoPlayer.evaluate((_hoverVideoPlayer: HTMLElement & { playbackStartDelay: number }) => {
        _hoverVideoPlayer.removeAttribute("playback-start-delay");
    });

    await expect(hoverVideoPlayer).toHaveJSProperty("playbackStartDelay", 0);

    await hoverVideoPlayer.evaluate((_hoverVideoPlayer: HTMLElement & { playbackStartDelay: number }) => {
        _hoverVideoPlayer.playbackStartDelay = 500;
    });
    await expect(hoverVideoPlayer).not.toHaveAttribute("playback-start-delay", "500");
})

test("playback timeouts are canceled if the user mouses away before it can run", async ({ page }) => {
    await page.goto('/tests/playbackStartDelay.html');

    const hoverVideoPlayer = await page.locator("hover-video-player");
    const video = await hoverVideoPlayer.locator("video");

    await Promise.all([
        expect(hoverVideoPlayer).toHaveAttribute("playback-start-delay", "300"),
        expect(hoverVideoPlayer).toHaveJSProperty("playbackStartDelay", 300),
    ]);

    await hoverOver(hoverVideoPlayer, false);
    await expect(video, "the video should still be paused").toHaveJSProperty("paused", true);
    await hoverOut(hoverVideoPlayer, false);
    await page.waitForTimeout(500);

    await expect(video, "the video should still not be playing").toHaveJSProperty("paused", true);
})