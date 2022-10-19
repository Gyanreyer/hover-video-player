import { test, expect } from '@playwright/test';

test("fires hoverstart and hoverend events as expected", async ({ page }) => {
    await page.goto("/tests/events/index.html");

    const component = await page.locator("hover-video-player");
    const hoverStartCounter = await page.locator("#hover-start-count");
    const hoverEndCounter = await page.locator("#hover-end-count");

    await expect(hoverStartCounter).toHaveText("0");
    await expect(hoverEndCounter).toHaveText("0");

    await component.hover();

    await expect(hoverStartCounter).toHaveText("1");
    await expect(hoverEndCounter).toHaveText("0");

    await page.mouse.move(0, 0);

    await expect(hoverStartCounter).toHaveText("1");
    await expect(hoverEndCounter).toHaveText("1");
});
