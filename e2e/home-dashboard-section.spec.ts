import { expect, test } from "@playwright/test";
import { resetE2ESessionStorage } from "./helpers/e2e-ui";

test("dashboard example is framed as a compact launcher with dialog preview", async ({ page }) => {
  await resetE2ESessionStorage(page);
  await page.goto("/");

  await expect(page.getByText("Live product snapshot")).toHaveCount(0);
  await expect
    .poll(
      async () => {
        await page.mouse.wheel(0, 700);
        await page.waitForTimeout(100);
        return page.getByRole("heading", { name: "Dashboard sample" }).count();
      },
      { timeout: 15_000 },
    )
    .toBeGreaterThan(0);

  const section = page.getByTestId("example-output-section");
  await section.scrollIntoViewIfNeeded();
  await expect(section.getByRole("heading", { name: "Dashboard sample" })).toBeVisible();
  await expect(section.getByText("Sample output")).toBeVisible();
  await expect(section.getByText("See what a downloaded starter can look like.")).toBeVisible();
  await expect(section.getByRole("link", { name: /load sample/i })).toHaveAttribute(
    "href",
    "/demo#upload-flow",
  );
  await expect(section.getByRole("button", { name: /preview/i })).toBeVisible();
  await expect(section.getByRole("link", { name: /pick a different sample/i })).toHaveCount(0);
  await expect(section.getByRole("link", { name: /choose another/i })).toHaveCount(0);
  await expect(page.getByTestId("desktop-example-output-preview")).toHaveCount(0);
  await expect(page.getByTestId("mobile-example-output-preview")).toHaveCount(0);
  await expect(page.getByText("Dashboard UI support")).toHaveCount(0);
  await expect(
    page.getByText(/Exported starters appear in the upload flow/i),
  ).toHaveCount(0);

  await section.getByRole("button", { name: /preview/i }).click();
  const dialog = page.getByTestId("dashboard-sample-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("tab", { name: /preview/i })).toBeVisible();
  await expect(dialog.getByRole("tab", { name: /plan/i })).toBeVisible();
  await expect(dialog.getByRole("tab", { name: /detected ui/i })).toBeVisible();
  await expect(dialog.getByRole("tab", { name: /download/i })).toBeVisible();
  await expect(dialog.getByTestId("dashboard-sample-dialog-preview")).toBeVisible();
  await expect(dialog.getByRole("link", { name: /load into workflow/i })).toHaveAttribute(
    "href",
    "/demo#upload-flow",
  );
});

test("dashboard example keeps the heavy preview behind a mobile dialog", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await resetE2ESessionStorage(page);
  await page.goto("/");

  await expect
    .poll(
      async () => {
        await page.mouse.wheel(0, 700);
        await page.waitForTimeout(100);
        return page.getByTestId("example-output-section").count();
      },
      { timeout: 15_000 },
    )
    .toBeGreaterThan(0);

  const launcher = page.getByTestId("example-output-section");
  await launcher.scrollIntoViewIfNeeded();
  await expect(launcher).toBeVisible();
  await expect(page.getByTestId("desktop-example-output-preview")).toHaveCount(0);
  await expect(page.getByTestId("mobile-example-output-preview")).toHaveCount(0);
  await expect(page.getByTestId("dashboard-sample-dialog")).toHaveCount(0);

  await launcher.getByRole("button", { name: /preview/i }).click();
  const dialog = page.getByTestId("dashboard-sample-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("tab", { name: /preview/i })).toBeVisible();
  await expect(dialog.getByRole("tab", { name: /plan/i })).toBeVisible();
  await expect(dialog.getByRole("tab", { name: /detected ui/i })).toBeVisible();
  await expect(dialog.getByRole("tab", { name: /download/i })).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: /load into workflow/i }),
  ).toBeVisible();

  const layout = await dialog.evaluate((node) => {
    const dialogRect = node.getBoundingClientRect();
    const tablist = node.querySelector('[role="tablist"]');
    const footer = node.querySelector('a[href="/demo#upload-flow"]')?.parentElement;
    const tablistRect = tablist?.getBoundingClientRect();
    const footerRect = footer?.getBoundingClientRect();

    return {
      pageHasHorizontalOverflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
      dialogInsideViewport:
        dialogRect.left >= -1 &&
        dialogRect.right <= window.innerWidth + 1 &&
        dialogRect.top >= -1 &&
        dialogRect.bottom <= window.innerHeight + 1,
      tablistInside:
        !!tablistRect &&
        tablistRect.left >= dialogRect.left - 1 &&
        tablistRect.right <= dialogRect.right + 1 &&
        tablistRect.top >= dialogRect.top - 1,
      footerInside:
        !!footerRect &&
        footerRect.left >= dialogRect.left - 1 &&
        footerRect.right <= dialogRect.right + 1 &&
        footerRect.bottom <= dialogRect.bottom + 1,
    };
  });

  expect(layout).toEqual({
    pageHasHorizontalOverflow: false,
    dialogInsideViewport: true,
    tablistInside: true,
    footerInside: true,
  });
});
