import { expect, test } from "@playwright/test";
import {
  mockAnalyzeApiForE2E,
  stubClipboardForE2E,
} from "./helpers/mock-analyze-api";

test.beforeEach(async ({ page }) => {
  await stubClipboardForE2E(page);
  await mockAnalyzeApiForE2E(page);
});

test("switches between light and dark themes", async ({ page }) => {
  await page.goto("/");

  const root = page.locator("html");
  const themeToggle = page.getByRole("button", {
    name: /switch to (dark|light) mode/i,
  });

  const wasDark = await root.evaluate((el) => el.classList.contains("dark"));
  await themeToggle.click();

  if (wasDark) {
    await expect(root).not.toHaveClass(/dark/);
    await expect(themeToggle).toHaveAttribute("aria-label", /switch to dark mode/i);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("theme"))).toBe(
      "light",
    );
  } else {
    await expect(root).toHaveClass(/dark/);
    await expect(themeToggle).toHaveAttribute("aria-label", /switch to light mode/i);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("theme"))).toBe(
      "dark",
    );
  }
});

test("switches brand theme and persists selection", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /switch brand theme/i }).click();
  await page.getByRole("menuitemradio", { name: /Emerald Pro/i }).click();

  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.brand)).toBe(
    "emerald",
  );
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("brand-theme")))
    .toBe("emerald");
});

test("filters and searches in design system catalog", async ({ page }) => {
  await page.goto("/design-system");

  const visibleMetric = page
    .locator("p:text-is('Visible')")
    .locator("xpath=following-sibling::p[1]");
  await expect(visibleMetric).toHaveText(/\d+/);

  await page.getByRole("searchbox", { name: /search catalog/i }).fill("zzzz-no-match");
  await expect(page.getByText("No components match your search.")).toBeVisible();
  await expect(visibleMetric).toHaveText("0");

  await page.getByRole("searchbox", { name: /search catalog/i }).fill("button");
  await expect(page.getByText("No components match your search.")).toBeHidden();
  await expect(visibleMetric).not.toHaveText("0");

  await page.getByRole("button", { name: /^molecule$/i }).click();
  const tierMetric = page.locator("p:text-is('Tier')").locator("xpath=following-sibling::p[1]");
  await expect(tierMetric).toHaveText(/molecule/i);
});

test("runs deterministic offline demo flow", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /use sample screenshot/i }).click();
  await expect(page.getByText(/Sample screenshot loaded/i)).toBeVisible();

  await page.getByRole("button", { name: /^Analyze$/i }).click();
  await expect(page.getByRole("status").first()).toContainText(/offline demo mode/i);
  await expect(page.getByText(/Demo analysis complete/i)).toBeVisible();
});

test("supports dashboard and design-system exports", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /use sample screenshot/i }).click();
  await page.getByRole("button", { name: /^Analyze$/i }).click();
  await expect(page.getByText(/Demo analysis complete/i)).toBeVisible();

  await page.getByRole("button", { name: /generate preview/i }).click();
  await expect(page.getByText(/Generated scaffold/i)).toBeVisible();

  const dashboardDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /^Export code$/i }).click();
  const dashboardDownload = await dashboardDownloadPromise;
  expect(dashboardDownload.suggestedFilename()).toBe("generated-dashboard.tsx");

  await page.goto("/design-system");
  const bundleDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /export all snippets/i }).click();
  const bundleDownload = await bundleDownloadPromise;
  expect(bundleDownload.suggestedFilename()).toBe(
    "qwen-ui-lab-design-system-bundle.tsx",
  );
});
