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

async function expectNoHorizontalOverflow(page: Page, label: string) {
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
        message: `expected no horizontal overflow for ${label}`,
      },
    )
    .toBeLessThanOrEqual(1);
}

async function expectDialogContained(page: Page, testId: string, label: string) {
  await expect
    .poll(
      () =>
        page.getByTestId(testId).evaluate((node) => {
          const box = node.getBoundingClientRect();
          return {
            insideX: box.left >= -1 && box.right <= window.innerWidth + 1,
            insideY: box.top >= -1 && box.bottom <= window.innerHeight + 1,
            widthFits: box.width <= window.innerWidth + 1,
            heightFits: box.height <= window.innerHeight + 1,
          };
        }),
      {
        message: `expected ${label} dialog to stay inside the viewport`,
      },
    )
    .toEqual({
      insideX: true,
      insideY: true,
      widthFits: true,
      heightFits: true,
    });
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

test("launch modal surfaces stay contained across core breakpoints", async ({
  page,
}) => {
  for (const viewport of LAUNCH_VIEWPORTS) {
    await page.setViewportSize(viewport);

    await resetE2ESessionStorage(page);
    await page.goto("/?account=1");
    await expect(page.getByTestId("account-modal")).toBeVisible();
    await expectDialogContained(page, "account-modal", `account at ${viewport.width}px`);
    await expectNoHorizontalOverflow(page, `account modal at ${viewport.width}px`);

    await resetE2ESessionStorage(page);
    await page.goto("/");
    await expect(page.getByTestId("example-output-section")).toBeVisible();
    await page
      .getByTestId("example-output-section")
      .getByRole("button", { name: /preview/i })
      .click();
    await expect(page.getByTestId("dashboard-sample-dialog")).toBeVisible();
    await expectDialogContained(
      page,
      "dashboard-sample-dialog",
      `sample preview at ${viewport.width}px`,
    );
    await expectNoHorizontalOverflow(
      page,
      `sample preview dialog at ${viewport.width}px`,
    );
  }
});
