import { expect, test } from "@playwright/test";
import { resetE2ESessionStorage } from "./helpers/e2e-ui";

test("footer presents brand, creator links, and responsive columns", async ({ page }) => {
  await page.setViewportSize({ width: 693, height: 958 });
  await resetE2ESessionStorage(page);
  await page.goto("/");

  const footer = page.getByRole("contentinfo");
  await footer.scrollIntoViewIfNeeded();
  await expect(footer).toBeVisible();

  await expect(footer.locator('img[src="/icons/icon.svg"]')).toHaveCount(1);
  await expect(footer.getByText("Screenshot to scaffold lab")).toBeVisible();
  await expect(page.getByTestId("production-readiness-panel")).toBeHidden();

  const githubIconLink = footer.locator('a[aria-label="GitHub"]');
  await expect(githubIconLink).toHaveAttribute("href", "https://github.com/Iron-Mark");

  const portfolioIconLink = footer.locator('a[aria-label="Portfolio"]');
  await expect(portfolioIconLink).toHaveAttribute("href", "https://marksiazon.dev");

  await expect(footer.getByRole("navigation", { name: "Product" })).toBeVisible();
  await expect(footer.getByRole("navigation", { name: "Resources" })).toBeVisible();
  await expect(footer.getByRole("navigation", { name: "Creator links" })).toHaveCount(
    0,
  );
  await expect(footer.getByTestId("developer-readiness-trigger")).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1,
      ),
    )
    .toBe(true);

  await expect
    .poll(() =>
      page.evaluate(() => {
        const footer = document.querySelector(
          'footer:not([data-nextjs-error-overlay-footer])',
        );
        return footer?.getBoundingClientRect().height ?? 0;
      }),
    )
    .toBeLessThanOrEqual(290);
});

test("footer developer dialog contains production readiness checks", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1269, height: 958 });
  await resetE2ESessionStorage(page);
  await page.goto("/");

  await expect(page.getByTestId("production-readiness-panel")).toBeHidden();

  const footer = page.getByRole("contentinfo");
  await footer.scrollIntoViewIfNeeded();
  await footer.getByTestId("developer-readiness-trigger").click();

  await expect(page.getByText("Developer status", { exact: true })).toBeVisible();
  await expect(page.getByTestId("production-readiness-panel")).toBeVisible();
  await expect(page.getByTestId("readiness-check").first()).toBeVisible({
    timeout: 10_000,
  });
});

test("design system footer stays compact after short content", async ({ page }) => {
  await page.setViewportSize({ width: 693, height: 958 });
  await resetE2ESessionStorage(page);
  await page.goto("/design-system?selected=shadcn-button");

  const footer = page.getByRole("contentinfo");
  await footer.scrollIntoViewIfNeeded();
  await expect(footer).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const footer = document.querySelector(
          'footer:not([data-nextjs-error-overlay-footer])',
        );
        return footer?.getBoundingClientRect().height ?? 0;
      }),
    )
    .toBeLessThanOrEqual(290);
});
