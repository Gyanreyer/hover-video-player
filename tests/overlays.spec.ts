import { test, expect } from '@playwright/test';
import { hoverOver, hoverOut } from './utils/hoverEvents';

test("contents in the hover-overlay slot work as expected", async ({ page, isMobile }) => {
    await page.goto("/tests/overlays.html");

    const hoverVideoPlayer = await page.locator("hover-video-player");
    const hoverOverlay = await hoverVideoPlayer.locator("[slot='hover-overlay']");

    await Promise.all([
        expect(hoverOverlay).toHaveCSS("opacity", "0"),
        expect(hoverOverlay).toHaveCSS("transition-property", "opacity, visibility"),
        expect(hoverOverlay).toHaveCSS("transition-duration", "0.3s, 0s"),
        expect(hoverOverlay).toHaveCSS("transition-delay", "0s, 0.3s"),
    ]);

    await hoverOver(hoverVideoPlayer, isMobile);

    await expect(hoverOverlay).toHaveCSS("opacity", "1");

    await hoverOut(hoverVideoPlayer, isMobile);

    await expect(hoverOverlay).toHaveCSS("opacity", "0");
});

test("contents in the paused-overlay slot work as expected", async ({ page, isMobile }) => {
    await page.route("**/*.mp4", (route) => new Promise((resolve) => {
        // Add a .25 second delay before resolving the request for the video asset so we can
        // test that the player enters a loading state while waiting for the video to load.
        setTimeout(() => resolve(route.continue()), 250);
    }));
    await page.goto("/tests/overlays.html");

    const hoverVideoPlayer = await page.locator("hover-video-player");
    const video = await hoverVideoPlayer.locator("video");
    const pausedOverlay = await hoverVideoPlayer.locator("[slot='paused-overlay']");

    await Promise.all([
        expect(pausedOverlay).toHaveCSS("opacity", "1"),
        // The visibility transition delay should be 0s because the paused-overlay is currently visible
        expect(pausedOverlay).toHaveCSS("transition-property", "opacity, visibility"),
        expect(pausedOverlay).toHaveCSS("transition-duration", "0.5s, 0s"),
        expect(pausedOverlay).toHaveCSS("transition-delay", "0s, 0s"),
    ])

    await hoverOver(hoverVideoPlayer, isMobile);

    await Promise.all([
        expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "loading"),
        expect(pausedOverlay).toHaveCSS("opacity", "1"),
        expect(pausedOverlay).toHaveCSS("transition-property", "opacity, visibility"),
        expect(pausedOverlay).toHaveCSS("transition-duration", "0.5s, 0s"),
        expect(pausedOverlay).toHaveCSS("transition-delay", "0s, 0s"),
    ]);
    await Promise.all([
        expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "playing"),
        expect(pausedOverlay).toHaveCSS("opacity", "0"),
        expect(pausedOverlay).toHaveCSS("transition-property", "opacity, visibility"),
        expect(pausedOverlay).toHaveCSS("transition-duration", "0.5s, 0s"),
        expect(pausedOverlay).toHaveCSS("transition-delay", "0s, 0.5s"),
    ]);

    await hoverOut(hoverVideoPlayer, isMobile);

    await Promise.all([
        expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "paused"),
        expect(video).toHaveJSProperty("paused", false),
    ])

    await Promise.all([
        expect(pausedOverlay).toHaveCSS("opacity", "1"),
        expect(video).toHaveJSProperty("paused", true),
    ]);
});

test("contents in the loading-overlay slot work as expected", async ({ page, isMobile }) => {
    await page.route("**/*.mp4", (route) => new Promise((resolve) => {
        // Add a 0.5 second delay before resolving the request for the video asset so we can
        // test that the loading overlay fades in while waiting for the video to load.
        setTimeout(() => resolve(route.continue()), 500);
    }));
    await page.goto("/tests/overlays.html");

    const hoverVideoPlayer = await page.locator("hover-video-player");
    const video = await hoverVideoPlayer.locator("video");
    const loadingOverlay = await hoverVideoPlayer.locator("[slot='loading-overlay']");

    await Promise.all([
        expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "paused"),
        // The loading timeout delay should not be applied to the opacity transition until it's fading in
        // The visibility transition should have a delay equal to the overlay transition duration so that
        // it doesn't become hidden until the overlay is full faded oug
        expect(loadingOverlay).toHaveCSS("transition-property", "opacity, visibility"),
        expect(loadingOverlay).toHaveCSS("transition-duration", "0.1s, 0s"),
        expect(loadingOverlay).toHaveCSS("transition-delay", "0s, 0.1s"),
        expect(loadingOverlay).toHaveCSS("opacity", "0"),
        expect(video).toHaveJSProperty("paused", true),
    ]);

    await hoverOver(hoverVideoPlayer, isMobile);

    await Promise.all([
        expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "loading"),
        // The loading timeout delay should now be applied to the opacity transition since it's fading in
        // The visibility transition should have a delay equal to the loading timeout duration so that
        // it doesn't become visibile until the overlay is ready to fade in
        expect(loadingOverlay).toHaveCSS("transition-property", "opacity, visibility"),
        expect(loadingOverlay).toHaveCSS("transition-duration", "0.1s, 0s"),
        expect(loadingOverlay).toHaveCSS("transition-delay", "0.2s, 0.2s"),
        expect(loadingOverlay).toHaveCSS("opacity", "1"),
        expect(video).toHaveJSProperty("paused", false),
    ]);

    await Promise.all([
        expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "playing"),
        expect(loadingOverlay).toHaveCSS("opacity", "0"),
        expect(loadingOverlay).toHaveCSS("transition-property", "opacity, visibility"),
        expect(loadingOverlay).toHaveCSS("transition-duration", "0.1s, 0s"),
        expect(loadingOverlay).toHaveCSS("transition-delay", "0s, 0.1s"),
    ]);

    await hoverOut(hoverVideoPlayer, isMobile);

    await Promise.all([
        expect(hoverVideoPlayer).toHaveAttribute("data-playback-state", "paused"),
        expect(loadingOverlay).toHaveCSS("opacity", "0"),
    ]);
});