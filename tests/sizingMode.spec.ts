import { test, expect } from '@playwright/test';

test('the sizing-mode attribute updates styles as expected', async ({ page }) => {
  await page.goto('/tests/sizingMode.html');

  const hoverVideoPlayer = await page.locator("hover-video-player");
  const video = await hoverVideoPlayer.locator("video");
  const pausedOverlay = await hoverVideoPlayer.locator("[slot='paused-overlay']");
  const loadingOverlay = await hoverVideoPlayer.locator("[slot='loading-overlay']");
  const hoverOverlay = await hoverVideoPlayer.locator("[slot='hover-overlay']");

  // Default sizing mode is "video"
  await expect(hoverVideoPlayer).toHaveAttribute("sizing-mode", "video");

  // Get bounding boxes for all elements so we can check that they're all the same size
  let [videoBoundingBox, componentBoundingBox, pausedOverlayBoundingBox, loadingOverlayBoundingBox, hoverOverlayBoundingBox] = await Promise.all([
    video.boundingBox(),
    hoverVideoPlayer.boundingBox(),
    pausedOverlay.boundingBox(),
    loadingOverlay.boundingBox(),
    hoverOverlay.boundingBox(),
  ]);

  if (!videoBoundingBox || !componentBoundingBox || !pausedOverlayBoundingBox || !loadingOverlayBoundingBox || !hoverOverlayBoundingBox) {
    throw new Error('Element bounding box is unexpectedly null');
  }

  const windowWidth = await page.evaluate(() => window.innerWidth);
  // The video should be its native 1280 width at most, or the window width if the window is smaller
  const expectedVideoWidth = Math.min(windowWidth, 1280);
  const expectedVideoHeight = expectedVideoWidth * 720 / 1280;

  await expect(videoBoundingBox.width).toBeCloseTo(expectedVideoWidth, 1);
  await expect(videoBoundingBox.height).toBeCloseTo(expectedVideoHeight, 1);

  // The component and all overlays should match the video's dimensions
  await Promise.all([
    expect(componentBoundingBox).toEqual(videoBoundingBox),
    expect(pausedOverlayBoundingBox).toEqual(videoBoundingBox),
    expect(loadingOverlayBoundingBox).toEqual(videoBoundingBox),
    expect(hoverOverlayBoundingBox).toEqual(videoBoundingBox),
  ]);

  // Set the sizing-mode to "container"
  await hoverVideoPlayer.evaluate((hvpElement) => {
    hvpElement.setAttribute('sizing-mode', 'container');
    hvpElement.style.width = '100px';
    hvpElement.style.height = '200px';
  });

  // Get the new bounding boxes
  [videoBoundingBox, componentBoundingBox, pausedOverlayBoundingBox, loadingOverlayBoundingBox, hoverOverlayBoundingBox] = await Promise.all([
    video.boundingBox(),
    hoverVideoPlayer.boundingBox(),
    pausedOverlay.boundingBox(),
    loadingOverlay.boundingBox(),
    hoverOverlay.boundingBox(),
  ]);

  if (!videoBoundingBox || !componentBoundingBox || !pausedOverlayBoundingBox || !loadingOverlayBoundingBox || !hoverOverlayBoundingBox) {
    throw new Error('Element bounding box is unexpectedly null');
  }

  await expect(componentBoundingBox.width).toBeCloseTo(100);
  await expect(componentBoundingBox.height).toBeCloseTo(200);

  // The video and all overlays should match the component's dimensions
  await Promise.all([
    expect(videoBoundingBox).toEqual(componentBoundingBox),
    expect(pausedOverlayBoundingBox).toEqual(componentBoundingBox),
    expect(loadingOverlayBoundingBox).toEqual(componentBoundingBox),
    expect(hoverOverlayBoundingBox).toEqual(componentBoundingBox),
  ]);

  // Set the sizing-mode to "overlay"
  await hoverVideoPlayer.evaluate((hvpElement) => {
    hvpElement.setAttribute('sizing-mode', 'overlay');
    hvpElement.style.width = '';
    hvpElement.style.height = '';
  });
  await pausedOverlay.evaluate((overlayElement) => {
    overlayElement.style.width = '300px';
    overlayElement.style.height = '600px';
  });

  // Get the new bounding boxes
  [videoBoundingBox, componentBoundingBox, pausedOverlayBoundingBox, loadingOverlayBoundingBox, hoverOverlayBoundingBox] = await Promise.all([
    video.boundingBox(),
    hoverVideoPlayer.boundingBox(),
    pausedOverlay.boundingBox(),
    loadingOverlay.boundingBox(),
    hoverOverlay.boundingBox(),
  ]);

  if (!videoBoundingBox || !componentBoundingBox || !pausedOverlayBoundingBox || !loadingOverlayBoundingBox || !hoverOverlayBoundingBox) {
    throw new Error('Element bounding box is unexpectedly null');
  }

  await expect(pausedOverlayBoundingBox.width).toBeCloseTo(300);
  await expect(pausedOverlayBoundingBox.height).toBeCloseTo(600);

  // The component, video, and other overlays should match the component's dimensions
  await Promise.all([
    expect(componentBoundingBox).toEqual(pausedOverlayBoundingBox),
    expect(videoBoundingBox).toEqual(pausedOverlayBoundingBox),
    expect(loadingOverlayBoundingBox).toEqual(pausedOverlayBoundingBox),
    expect(hoverOverlayBoundingBox).toEqual(pausedOverlayBoundingBox),
  ]);
});