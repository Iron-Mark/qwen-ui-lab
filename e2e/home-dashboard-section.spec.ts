import { expect, test } from "@playwright/test";
import { resetE2ESessionStorage } from "./helpers/e2e-ui";

test("dashboard example is labeled as static support content", async ({ page }) => {
  await resetE2ESessionStorage(page);
  await page.goto("/");

  await expect(page.getByText("Live product snapshot")).toHaveCount(0);
  await expect
    .poll(
      async () => {
        await page.mouse.wheel(0, 700);
        await page.waitForTimeout(100);
        return page.getByRole("heading", { name: "Dashboard UI support" }).count();
      },
      { timeout: 15_000 },
    )
    .toBeGreaterThan(0);

  const dashboardSupport = page.getByRole("heading", {
    name: "Dashboard UI support",
  });
  await dashboardSupport.scrollIntoViewIfNeeded();
  await expect(dashboardSupport).toBeVisible();
  await expect(page.getByText("Static dashboard example")).toBeVisible();
  await expect(
    page.getByText(/Generated results appear in the upload flow/i),
  ).toBeVisible();
});
