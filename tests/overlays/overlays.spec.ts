import { test, expect } from '@playwright/test';

test("contents in the hover-overlay slot work as expected", async ({ page }) => {
    await page.goto("/tests/overlays/index.html");

    const hoverVideoPlayer = await page.locator("hover-video-player");
    const hoverOverlay = await hoverVideoPlayer.locator("[slot='hover-overlay']");

    await Promise.all([
        expect(hoverOverlay).toHaveCSS("opacity", "0"),
        expect(hoverOverlay).toHaveCSS("transition", "opacity 0.3s ease 0s"),
    ]);

    await hoverVideoPlayer.hover();

    await expect(hoverOverlay).toHaveCSS("opacity", "1");

    await page.mouse.move(0, 0);

    await expect(hoverOverlay).toHaveCSS("opacity", "0");
});

test("contents in the paused-overlay slot work as expected", async ({ page }) => {
    await page.route("**/*.mp4", (route) => new Promise((resolve) => {
        // Add a .25 second delay before resolving the request for the video asset so we can
        // test that the player enters a loading state while waiting for the video to load.
        setTimeout(() => resolve(route.continue()), 250);
    }));
    await page.goto("/tests/overlays/index.html");

    const hoverVideoPlayer = await page.locator("hover-video-player");
    const video = await hoverVideoPlayer.locator("video");
    const pausedOverlay = await hoverVideoPlayer.locator("[slot='paused-overlay']");

    await Promise.all([
        expect(pausedOverlay).toHaveCSS("opacity", "1"),
        expect(pausedOverlay).toHaveCSS("transition", "opacity 0.5s ease 0s"),
    ])

    await hoverVideoPlayer.hover();

    await Promise.all([
        expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "loading"),
        expect(pausedOverlay).toHaveCSS("opacity", "1"),
    ]);
    await Promise.all([
        expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "playing"),
        expect(pausedOverlay).toHaveCSS("opacity", "0"),
    ]);

    await page.mouse.move(0, 0);

    await Promise.all([
        expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "paused"),
        expect(video).toHaveJSProperty("paused", false),
    ])

    await Promise.all([
        expect(pausedOverlay).toHaveCSS("opacity", "1"),
        expect(video).toHaveJSProperty("paused", true),
    ]);
});

test("contents in the loading-overlay slot work as expected", async ({ page }) => {
    await page.route("**/*.mp4", (route) => new Promise((resolve) => {
        // Add a 0.5 second delay before resolving the request for the video asset so we can
        // test that the loading overlay fades in while waiting for the video to load.
        setTimeout(() => resolve(route.continue()), 500);
    }));
    await page.goto("/tests/overlays/index.html");

    const hoverVideoPlayer = await page.locator("hover-video-player");
    const video = await hoverVideoPlayer.locator("video");
    const loadingOverlay = await hoverVideoPlayer.locator("[slot='loading-overlay']");

    await Promise.all([
        expect(loadingOverlay).toHaveCSS("opacity", "0"),
        // The loading timeout delay should not be applied to the loading overlay's transition until it's fading in
        expect(loadingOverlay).toHaveCSS("transition", "opacity 0.1s ease 0s"),
        expect(video).toHaveJSProperty("paused", true),
    ]);

    await hoverVideoPlayer.hover();

    await Promise.all([
        expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "loading"),
        // The loading timeout delay should be applied to the loading overlay's transition now
        expect(loadingOverlay).toHaveCSS("transition", "opacity 0.1s ease 0.2s"),
        expect(loadingOverlay).toHaveCSS("opacity", "1"),
        expect(video).toHaveJSProperty("paused", false),
    ]);

    await Promise.all([
        expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "playing"),
        expect(loadingOverlay).toHaveCSS("opacity", "0"),
    ]);

    await page.mouse.move(0, 0);

    await Promise.all([
        expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "paused"),
        expect(loadingOverlay).toHaveCSS("opacity", "0"),
    ]);
});