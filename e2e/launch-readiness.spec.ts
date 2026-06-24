import { expect, test, type Page } from "@playwright/test";
import {
  resetE2ESessionStorage,
  waitForDesignSystemPreview,
} from "./helpers/e2e-ui";

const LAUNCH_VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 840, height: 958 },
  { width: 1440, height: 900 },
] as const;

const PUBLIC_ROUTES = [
  "/",
  "/design-system?selected=shadcn-button",
  "/demo",
  "/offline.html",
  "/missing-launch-route",
] as const;

async function waitForRouteReady(page: Page, route: string) {
  if (route.startsWith("/design-system")) {
    await waitForDesignSystemPreview(page);
    return;
  }

  if (route === "/") {
    await expect(page.getByTestId("home-marketing-hero")).toBeVisible();
    return;
  }

  if (route === "/offline.html") {
    await expect(page.getByRole("heading", { name: "You're offline" })).toBeVisible();
    return;
  }

  await expect(page.locator("body")).toBeVisible();
}

test("launch routes avoid horizontal overflow across core breakpoints", async ({
  page,
}) => {
  for (const viewport of LAUNCH_VIEWPORTS) {
    await page.setViewportSize(viewport);

    for (const route of PUBLIC_ROUTES) {
      await resetE2ESessionStorage(page);
      await page.goto(route);
      await waitForRouteReady(page, route);

      await expect
        .poll(
          () =>
            page.evaluate(() => {
              const viewportWidth = document.documentElement.clientWidth;
              return Math.max(
                0,
                document.body.scrollWidth - viewportWidth,
                document.documentElement.scrollWidth - viewportWidth,
              );
            }),
          {
            message: `expected no horizontal overflow on ${route} at ${viewport.width}px`,
          },
        )
        .toBeLessThanOrEqual(1);
    }
  }
});

test("keyboard users can skip directly to main content", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await resetE2ESessionStorage(page);
  await page.goto("/");

  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();

  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
});
