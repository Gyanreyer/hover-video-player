import { test, expect, Page, Locator } from '@playwright/test';

const expectComponentHasHoverTarget = async (page: Page, componentLocator: Locator, expectedElementLocator: Locator) => {
    // The component's `hoverTarget` property should match the expected element
    expect(await page.evaluate(({
        component, expectedHoverTarget,
    }) => {
        const hoverTarget = (component as any).hoverTarget;
        if (Symbol.iterator in hoverTarget) {
            return Array.from(hoverTarget).includes(expectedHoverTarget);
        } else {
            return hoverTarget === expectedHoverTarget;
        }
    }, { component: await componentLocator.elementHandle(), expectedHoverTarget: await expectedElementLocator.elementHandle() })).toBe(true);
    const video = await componentLocator.locator("video");
    // The video should be paused
    await expect(video).toHaveJSProperty("paused", true);
    // Hovering over the hover target should start playing the video
    await expectedElementLocator.hover();
    await expect(video).toHaveJSProperty("paused", false);
    // Mousing out of the hover target should pause the video
    await page.mouse.move(0, 0);
    await expect(video).toHaveJSProperty("paused", true);
}

test("hoverTarget can be updated via attribute for a component with an initial hover target set", async ({ page }) => {
    await page.goto("/tests/hoverTarget.html");

    const [componentWithInitialHoverTarget, hoverTarget1, hoverTarget2] = await Promise.all([
        page.locator("[data-testid='has-initial-hover-target']"),
        page.locator("#hover-target-1"),
        page.locator("#hover-target-2"),
    ]);

    // The component with an initial hover target should have hoverTarget1 as its hover target
    await expectComponentHasHoverTarget(page, componentWithInitialHoverTarget, hoverTarget1);

    // Update the hover-target attribute to point to hoverTarget2
    await componentWithInitialHoverTarget.evaluate((componentElement) => { componentElement.setAttribute("hover-target", "#hover-target-2") });
    await expectComponentHasHoverTarget(page, componentWithInitialHoverTarget, hoverTarget2);

    // Update the component hover target to hoverTarget1 by setting the hoverTarget JS property
    await componentWithInitialHoverTarget.evaluate((componentElement: any) => { componentElement.hoverTarget = document.getElementById("hover-target-1"); });
    await expectComponentHasHoverTarget(page, componentWithInitialHoverTarget, hoverTarget1);
    // The hover-target attribute should be cleared
    await expect(await componentWithInitialHoverTarget.evaluate((componentElement) => componentElement.getAttribute("hover-target"))).toBe(null);

    // Update the hover-target attribute to continue pointing to hoverTarget1
    await componentWithInitialHoverTarget.evaluate((componentElement) => { componentElement.setAttribute("hover-target", "#hover-target-1") });
    await expectComponentHasHoverTarget(page, componentWithInitialHoverTarget, hoverTarget1);

    // Remove the hover-target attribute to revert to using the component host element as the hover target
    await componentWithInitialHoverTarget.evaluate((componentElement) => { componentElement.removeAttribute("hover-target") });
    await expectComponentHasHoverTarget(page, componentWithInitialHoverTarget, componentWithInitialHoverTarget);

    // Update the component hover target to hoverTarget2 by setting the hoverTarget JS property
    await componentWithInitialHoverTarget.evaluate((componentElement: any) => { componentElement.hoverTarget = document.getElementById("hover-target-2"); });
    await expectComponentHasHoverTarget(page, componentWithInitialHoverTarget, hoverTarget2);

    // Set the hoverTarget JS property to null to revert to using the component host element as the hover target
    await componentWithInitialHoverTarget.evaluate((componentElement: any) => { componentElement.hoverTarget = null; });
    await expectComponentHasHoverTarget(page, componentWithInitialHoverTarget, componentWithInitialHoverTarget);
});

test("hoverTarget can be updated for a component without an initial hover target set", async ({ page }) => {
    await page.goto("/tests/hoverTarget.html");

    const [componentWithNoInitialHoverTarget, hoverTarget1, hoverTarget2] = await Promise.all([
        page.locator("[data-testid='no-initial-hover-target']"),
        page.locator("#hover-target-1"),
        page.locator("#hover-target-2"),
    ]);

    // The component should have its own host element as the initial hover target
    await expectComponentHasHoverTarget(page, componentWithNoInitialHoverTarget, componentWithNoInitialHoverTarget);

    // Update the hover-target attribute to point to hoverTarget2
    await componentWithNoInitialHoverTarget.evaluate((componentElement) => { componentElement.setAttribute("hover-target", "#hover-target-2") });
    await expectComponentHasHoverTarget(page, componentWithNoInitialHoverTarget, hoverTarget2);

    // Update the component hover target to hoverTarget1 by setting the hoverTarget JS property
    await componentWithNoInitialHoverTarget.evaluate((componentElement: any) => { componentElement.hoverTarget = document.getElementById("hover-target-1"); });
    await expectComponentHasHoverTarget(page, componentWithNoInitialHoverTarget, hoverTarget1);
    // The hover-target attribute should be cleared
    await expect(await componentWithNoInitialHoverTarget.evaluate((componentElement) => componentElement.getAttribute("hover-target"))).toBe(null);

    // Update the hover-target attribute to point to hoverTarget1
    await componentWithNoInitialHoverTarget.evaluate((componentElement) => { componentElement.setAttribute("hover-target", "#hover-target-1") });
    await expectComponentHasHoverTarget(page, componentWithNoInitialHoverTarget, hoverTarget1);

    // Remove the hover-target attribute to revert to using the component host element as the hover target
    await componentWithNoInitialHoverTarget.evaluate((componentElement) => { componentElement.removeAttribute("hover-target") });
    await expectComponentHasHoverTarget(page, componentWithNoInitialHoverTarget, componentWithNoInitialHoverTarget);

    // Update the component hover target to hoverTarget1 by setting the hoverTarget JS property
    await componentWithNoInitialHoverTarget.evaluate((componentElement: any) => { componentElement.hoverTarget = document.getElementById("hover-target-1"); });
    await expectComponentHasHoverTarget(page, componentWithNoInitialHoverTarget, hoverTarget1);

    // Update the component hover target to both hoverTarget1 and hoverTarget2 by setting the hoverTarget JS property
    await componentWithNoInitialHoverTarget.evaluate((componentElement: any) => { componentElement.hoverTarget = document.querySelectorAll(".hover-target"); });
    await expectComponentHasHoverTarget(page, componentWithNoInitialHoverTarget, hoverTarget1);
    await expectComponentHasHoverTarget(page, componentWithNoInitialHoverTarget, hoverTarget2);

    // Set the hoverTarget JS property to null to revert to using the component host element as the hover target
    await componentWithNoInitialHoverTarget.evaluate((componentElement: any) => { componentElement.hoverTarget = null; });
    await expectComponentHasHoverTarget(page, componentWithNoInitialHoverTarget, componentWithNoInitialHoverTarget);
});

test("Multiple hoverTargets can be set at the same time for a single component", async ({ page }) => {
    await page.goto("/tests/hoverTarget.html");

    const [componentWithMultipleHoverTargets, hoverTarget1, hoverTarget2] = await Promise.all([
        page.locator("[data-testid='multiple-hover-targets']"),
        page.locator("#hover-target-1"),
        page.locator("#hover-target-2"),
    ]);

    // The component should have two hover targets at the same time
    expect(await componentWithMultipleHoverTargets.evaluate((componentElement: any) => componentElement.hoverTarget.length)).toBe(2);
    await expectComponentHasHoverTarget(page, componentWithMultipleHoverTargets, hoverTarget1);
    await expectComponentHasHoverTarget(page, componentWithMultipleHoverTargets, hoverTarget2);

    // Reset the component hover target to the host element
    await componentWithMultipleHoverTargets.evaluate((componentElement: any) => { componentElement.hoverTarget = null });
    await expectComponentHasHoverTarget(page, componentWithMultipleHoverTargets, componentWithMultipleHoverTargets);

    // Programmatically set the hover target to both hoverTarget1 and hoverTarget2 (they both have a .hover-target class)
    await componentWithMultipleHoverTargets.evaluate((componentElement: any) => { componentElement.hoverTarget = document.getElementsByClassName("hover-target"); });
    await expectComponentHasHoverTarget(page, componentWithMultipleHoverTargets, hoverTarget1);
    await expectComponentHasHoverTarget(page, componentWithMultipleHoverTargets, hoverTarget2);
});