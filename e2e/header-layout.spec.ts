import { expect, test } from "@playwright/test";
import { resetE2ESessionStorage } from "./helpers/e2e-ui";

const HEADER_VIEWPORTS = [
  { width: 320, height: 844 },
  { width: 390, height: 844 },
  { width: 693, height: 958 },
  { width: 768, height: 900 },
] as const;

test("site header does not create horizontal overflow", async ({ page }) => {
  for (const viewport of HEADER_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await resetE2ESessionStorage(page);
    await page.goto("/");

    const mainNav = page.getByRole("navigation", { name: "Main" });
    await expect(mainNav).toBeVisible();

    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const documentWidth = document.documentElement.clientWidth;
            const nav = document.querySelector<HTMLElement>(
              'header nav[aria-label="Main"]',
            );
            const navClientWidth = nav?.clientWidth ?? 0;
            const navScrollWidth = nav?.scrollWidth ?? 0;

            return (
              document.body.scrollWidth <= documentWidth + 1 &&
              document.documentElement.scrollWidth <= documentWidth + 1 &&
              navScrollWidth <= navClientWidth + 1
            );
          }),
        {
          message: `expected no horizontal overflow at ${viewport.width}px`,
        },
      )
      .toBe(true);

    const navMetrics = await mainNav.evaluate((nav) => ({
      clientWidth: nav.clientWidth,
      scrollWidth: nav.scrollWidth,
    }));
    expect(navMetrics.scrollWidth).toBeLessThanOrEqual(
      navMetrics.clientWidth + 1,
    );
  }
});

test("site header combines theme and brand controls into one appearance menu", async ({
  page,
}) => {
  await page.setViewportSize({ width: 693, height: 958 });
  await resetE2ESessionStorage(page);
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Switch brand theme" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Switch to dark mode" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Switch to light mode" }),
  ).toHaveCount(0);

  const appearanceButton = page.getByRole("button", {
    name: "Appearance settings",
  });
  await expect(appearanceButton).toBeVisible();
  await expect(appearanceButton).toBeEnabled();
  await expect
    .poll(() =>
      appearanceButton.evaluate((button) => {
        const { height, width } = button.getBoundingClientRect();
        return width >= 44 && height >= 44;
      }),
    )
    .toBe(true);
  await appearanceButton.click();

  await expect(page.getByText("Brand theme")).toBeVisible();
  await expect(page.getByRole("menuitemradio", { name: /Indigo Studio/i })).toBeVisible();
  const modeMenuItem = page
    .getByRole("menuitem")
    .filter({ hasText: /Switch to (dark|light) mode/i });
  await expect(modeMenuItem).toBeVisible();
  await expect
    .poll(() =>
      modeMenuItem.evaluate((item) => item.getBoundingClientRect().height >= 44),
    )
    .toBe(true);
});
