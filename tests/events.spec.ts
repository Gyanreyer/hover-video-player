import { test, expect } from '@playwright/test';
import type HoverVideoPlayer from '../src/hover-video-player';
import { hoverOver, hoverOut } from './utils/hoverEvents';

test("fires hoverstart and hoverend events as expected", async ({ page, isMobile }) => {
    await page.goto("/tests/events.html");

    const component = await page.locator("hover-video-player");
    const hoverStartCounter = await page.locator("#hover-start-count");
    const hoverEndCounter = await page.locator("#hover-end-count");

    await expect(hoverStartCounter).toHaveText("0");
    await expect(hoverEndCounter).toHaveText("0");

    await hoverOver(component, isMobile);

    await expect(hoverStartCounter).toHaveText("1");
    await expect(hoverEndCounter).toHaveText("0");

    await hoverOut(component, isMobile);

    await expect(hoverStartCounter).toHaveText("1");
    await expect(hoverEndCounter).toHaveText("1");
});

test("hoverstart events can be prevented", async ({ page, isMobile }) => {
    await page.goto("/tests/events.html");

    const component = await page.locator("hover-video-player");

    await component.evaluate((el: HoverVideoPlayer) => {
        (window as any).hoverStartListener = (evt) => {
            evt.preventDefault();
        };
        el.addEventListener("hoverstart", (window as any).hoverStartListener);
    });

    await hoverOver(component, isMobile);

    await expect(component).not.toHaveAttribute("data-is-hovering", "");

    await hoverOut(component, isMobile);

    // Remoe the listener and hover again
    await component.evaluate((el: HoverVideoPlayer) => {
        el.removeEventListener("hoverstart", (window as any).hoverStartListener);
    });

    // Now hovering should work
    await hoverOver(component, isMobile);
    await expect(component).toHaveAttribute("data-is-hovering", "");

    await hoverOut(component, isMobile);
});

test("hoverend events can be prevented", async ({ page, isMobile }) => {
    await page.goto("/tests/events.html");

    const component = await page.locator("hover-video-player");

    await component.evaluate((el: HoverVideoPlayer) => {
        (window as any).hoverEndListener = (evt) => {
            evt.preventDefault();
        };
        el.addEventListener("hoverend", (window as any).hoverEndListener);
    });

    await hoverOver(component, isMobile);

    await expect(component).toHaveAttribute("data-is-hovering", "");

    await hoverOut(component, isMobile);

    // Still hovering because hoverend was cancelled
    await expect(component).toHaveAttribute("data-is-hovering", "");

    await component.evaluate((el: HoverVideoPlayer) => {
        el.removeEventListener("hoverend", (window as any).hoverEndListener);
    });

    // Re-hover so we can test that hoverend is not prevented
    await hoverOver(component, isMobile);
    await expect(component).toHaveAttribute("data-is-hovering", "");

    // Now mousing out should work
    await hoverOut(component, isMobile);
    await expect(component).not.toHaveAttribute("data-is-hovering", "");
});