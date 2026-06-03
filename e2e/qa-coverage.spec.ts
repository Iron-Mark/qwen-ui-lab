import { expect, test } from "@playwright/test";
import {
  demoModeSnackbar,
  designSystemTierButton,
  expectDemoSnackbarSessionFlag,
  primaryAnalyzeButton,
  resetE2ESessionStorage,
  waitForSonnerToaster,
} from "./helpers/e2e-ui";
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

  const dismissDemo = page.getByRole("button", { name: /dismiss demo mode notice/i });
  if (await dismissDemo.isVisible().catch(() => false)) {
    await dismissDemo.click();
  }

  await page.getByRole("button", { name: /switch brand theme/i }).click();
  await expect(page.getByRole("menuitemradio", { name: /emerald/i })).toBeVisible();
  await page.getByRole("menuitemradio", { name: /emerald/i }).click();

  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.brand)).toBe(
    "emerald",
  );
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("brand-theme")))
    .toBe("emerald");
});

test("filters and searches in design system catalog", async ({ page }) => {
  await page.goto("/design-system");

  const visibleMetric = page.locator("header").getByText(/\d+\s+visible/i);
  await expect(visibleMetric).toBeVisible();

  await page.getByRole("searchbox", { name: /search catalog/i }).fill("zzzz-no-match");
  await expect(page.getByText("No components match your search.")).toBeVisible();
  await expect(visibleMetric).toHaveText(/0\s+visible/i);

  await page.getByRole("searchbox", { name: /search catalog/i }).fill("button");
  await expect(page.getByText("No components match your search.")).toBeHidden();
  await expect(visibleMetric).not.toHaveText(/0\s+visible/i);

  await designSystemTierButton(page, "molecule").click();
  await expect.poll(() => page.url()).toMatch(/level=molecule/);
});

test("runs deterministic offline demo flow", async ({ page }) => {
  await resetE2ESessionStorage(page);
  await page.goto("/");
  await waitForSonnerToaster(page);

  const sampleButton = page.getByRole("button", { name: /use sample screenshot/i });
  await expect(sampleButton).toBeVisible();
  await sampleButton.click();

  await expect(page.getByText(/dashboard-reference\.svg/i)).toBeVisible();
  await expect(primaryAnalyzeButton(page)).toBeEnabled({ timeout: 10_000 });

  await primaryAnalyzeButton(page).click();
  await expect(
    page.getByRole("status").filter({ hasText: /offline demo mode/i }).first(),
  ).toBeVisible();
  await expect(page.getByText(/Preview ready/i)).toBeVisible({ timeout: 15_000 });
});

test("supports dashboard and design-system exports", async ({ page }) => {
  test.setTimeout(60_000);

  await resetE2ESessionStorage(page);
  await page.goto("/");
  await waitForSonnerToaster(page);

  await page.getByRole("button", { name: /use sample screenshot/i }).click();
  await expect(page.getByText(/dashboard-reference\.svg/i)).toBeVisible();
  await expect(primaryAnalyzeButton(page)).toBeEnabled({ timeout: 10_000 });
  await primaryAnalyzeButton(page).click();
  await expect(page.getByText(/Generated scaffold/i)).toBeVisible();

  const complianceTrigger = page.getByTestId("ux-compliance-details-trigger");
  await expect(complianceTrigger).toBeVisible();
  await expect(complianceTrigger).toContainText(/\d+ met · \d+ partial · \d+ review/);
  await complianceTrigger.click();
  const complianceDialog = page.getByRole("dialog", { name: /laws of ux compliance/i });
  await expect(complianceDialog).toBeVisible();
  await expect(complianceDialog.getByText(/Fitts's Law/i)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(complianceDialog).toBeHidden();

  const dashboardDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /^Export code$/i }).click();
  const dashboardDownload = await dashboardDownloadPromise;
  expect(dashboardDownload.suggestedFilename()).toBe("generated-dashboard.tsx");

  await page.goto("/design-system", { waitUntil: "domcontentloaded", timeout: 45_000 });
  await expect(page.getByRole("searchbox", { name: /search catalog/i })).toBeVisible({
    timeout: 15_000,
  });
  const bundleDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /export all snippets/i }).click();
  const bundleDownload = await bundleDownloadPromise;
  expect(bundleDownload.suggestedFilename()).toBe(
    "qwen-ui-lab-design-system-bundle.tsx",
  );
});

test("shows demo snackbar once per session", async ({ page }) => {
  test.setTimeout(60_000);

  await resetE2ESessionStorage(page);
  await page.goto("/");
  await waitForSonnerToaster(page);

  const snackbar = demoModeSnackbar(page);
  await expect(snackbar).toBeVisible({ timeout: 15_000 });
  await expectDemoSnackbarSessionFlag(page, "1");

  const box = await snackbar.boundingBox();
  const viewport = page.viewportSize();
  if (box && viewport) {
    // Bottom placement should not cover the main header controls.
    expect(box.y).toBeGreaterThan(viewport.height * 0.45);
  }

  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(demoModeSnackbar(page)).toBeHidden({ timeout: 10_000 });
  await expectDemoSnackbarSessionFlag(page, "1");
});

test("design system scrolls to preview on mobile selection", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  await stubClipboardForE2E(page);
  await mockAnalyzeApiForE2E(page);

  await page.goto("/design-system");

  const previewPanel = page.locator("#component-preview-panel");
  await expect(previewPanel).toBeVisible();

  // Change selection after initial mount to trigger the mobile scroll behavior.
  const listPanel = page
    .getByText("Component list", { exact: true })
    .locator("xpath=ancestor::section[1]");
  const listButtons = listPanel.getByRole("button");
  await expect(listButtons.first()).toBeVisible();
  await listButtons.nth(1).click();

  await expect(page).toHaveURL(/selected=/);

  await expect
    .poll(async () => {
      const box = await previewPanel.boundingBox();
      if (!box) return null;
      const viewport = page.viewportSize();
      if (!viewport) return null;
      // Consider "scrolled into view" if the panel's top is within the first half of viewport.
      return box.y >= 0 && box.y < viewport.height / 2;
    })
    .toBeTruthy();

  await context.close();
});

test("preview segmented tabs switch modes", async ({ page }) => {
  await page.goto("/design-system");

  await page.getByRole("tab", { name: /mobile preview/i }).click();
  await expect(page).toHaveURL(/preview=mobile/);

  await page.getByRole("tab", { name: /desktop preview/i }).click();
  // Desktop is the default mode; query params omit defaults.
  await expect.poll(() => page.url()).not.toContain("preview=mobile");
});
