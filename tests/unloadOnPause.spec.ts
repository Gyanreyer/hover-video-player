import { test, expect } from '@playwright/test';

const HAVE_NOTHING = 0;
const HAVE_ENOUGH_DATA = 4;

test("unload-on-pause unloads video sources as expected for videos whose source is set by the src attribute", async ({ page }) => {
    await page.goto("/tests/unloadOnPause.html");

    const componentWithSrcAttribute = await page.locator("[data-testid='src-attribute']");
    const videoWithSrcAttribute = await componentWithSrcAttribute.locator("video");

    await Promise.all([
        expect(componentWithSrcAttribute).toHaveAttribute("unload-on-pause", ""),
        expect(componentWithSrcAttribute).toHaveJSProperty("unloadOnPause", true),
        // The video should only have metadata loaded at this point
        expect(videoWithSrcAttribute).toHaveJSProperty("readyState", HAVE_NOTHING),
    ]);

    // Hover to start playback
    await componentWithSrcAttribute.hover();
    // The video's source should be loaded now that it's playing
    await expect(videoWithSrcAttribute).toHaveJSProperty("readyState", HAVE_ENOUGH_DATA);

    // Mouse out to pause and unload the video
    await page.mouse.move(0, 0);
    // The video's source should be unloaded
    await expect(videoWithSrcAttribute).toHaveJSProperty("readyState", HAVE_NOTHING);

    // Disable unloading on pause
    await componentWithSrcAttribute.evaluate((componentElement: HTMLElement & { unloadOnPause: boolean }) => componentElement.unloadOnPause = false);

    // Hover to start playback
    await componentWithSrcAttribute.hover();
    // The video's source should be loaded now that it's playing
    await expect(videoWithSrcAttribute).toHaveJSProperty("readyState", HAVE_ENOUGH_DATA);

    // Mouse out to pause and unload the video
    await page.mouse.move(0, 0);
    // The video should not have been unloaded
    await expect(videoWithSrcAttribute).toHaveJSProperty("readyState", HAVE_ENOUGH_DATA);
});

test("unload-on-pause unloads video sources as expected for videos whose source is set by source tags", async ({ page }) => {
    await page.goto("/tests/unloadOnPause.html");

    const componentWithSourceTag = await page.locator("[data-testid='source-tag']");
    const videoWithSourceTag = await componentWithSourceTag.locator("video");

    await Promise.all([
        expect(componentWithSourceTag).toHaveAttribute("unload-on-pause", ""),
        expect(componentWithSourceTag).toHaveJSProperty("unloadOnPause", true),
        expect(videoWithSourceTag).toHaveJSProperty("preload", "none"),
        expect(videoWithSourceTag).toHaveJSProperty("readyState", HAVE_NOTHING),
    ]);

    // Hover to start playback
    await componentWithSourceTag.hover();
    // The video's source should be loaded now that it's playing
    await expect(videoWithSourceTag).toHaveJSProperty("readyState", HAVE_ENOUGH_DATA);

    // Mouse out to pause and unload the video
    await page.mouse.move(0, 0);
    // The video's source should be unloaded
    await expect(videoWithSourceTag).toHaveJSProperty("readyState", HAVE_NOTHING);

    // Disable unloading on pause
    await componentWithSourceTag.evaluate((componentElement: HTMLElement & { unloadOnPause: boolean }) => componentElement.unloadOnPause = false);

    // Hover to start playback
    await componentWithSourceTag.hover();
    // The video's source should be loaded now that it's playing
    await expect(videoWithSourceTag).toHaveJSProperty("readyState", HAVE_ENOUGH_DATA);

    // Mouse out to pause and unload the video
    await page.mouse.move(0, 0);
    // The video should not have been unloaded
    await expect(videoWithSourceTag).toHaveJSProperty("readyState", HAVE_ENOUGH_DATA);
});

test("if unload-on-pause is set and the video does not have a preload attribute set, it will default to metadata", async ({ page }) => {
    await page.goto("/tests/unloadOnPause.html");

    const component = await page.locator("[data-testid='no-preload-attribute']");
    const video = await component.locator("video");

    await expect(video).toHaveJSProperty("preload", "metadata");
});

test("interacts with restart-on-pause as expected", async ({ page }) => {
    await page.goto("/tests/unloadOnPause.html");

    const component = await page.locator("[data-testid='no-preload-attribute']");
    const video = await component.locator("video");

    await expect(video).toHaveJSProperty("currentTime", 0);
    await expect(component).toHaveJSProperty("restartOnPause", false);

    // Hover to start playback
    await component.hover();

    await expect(video).not.toHaveJSProperty("currentTime", 0);

    // Mouse out to pause and unload the video
    await page.mouse.move(0, 0);

    // The video should not have been reset to the beginning
    await expect(video).not.toHaveJSProperty("currentTime", 0);

    // Enable restart on pause
    await component.evaluate((componentElement: HTMLElement & { restartOnPause: boolean }) => componentElement.restartOnPause = true);

    // Hover to start playback
    await component.hover();

    await expect(video).not.toHaveJSProperty("currentTime", 0);

    // Mouse out to pause and unload the video
    await page.mouse.move(0, 0);

    // The video should have been reset to the bueginning
    await expect(video).toHaveJSProperty("currentTime", 0);
})