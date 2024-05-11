import { Locator } from "@playwright/test";

export const hoverOver = (hoverTargetLocator: Locator, isMobile: boolean) => {
  if (isMobile) {
    return hoverTargetLocator.tap();
  } else {
    return hoverTargetLocator.hover();
  }
};

export const hoverOut = (hoverTargetLocator: Locator, isMobile: boolean) => {
  const page = hoverTargetLocator.page();
  if (isMobile) {
    return page.dispatchEvent("body", "touchstart");
  } else {
    return page.mouse.move(0, 0);
  }
};

