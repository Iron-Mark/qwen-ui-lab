import { expect, test } from "@playwright/test";
import path from "node:path";
import {
  mockAnalyzeApiForE2E,
  stubClipboardForE2E,
} from "./helpers/mock-analyze-api";
import {
  primaryAnalyzeButton,
  resetE2ESessionStorage,
  waitForDesignSystemPreview,
} from "./helpers/e2e-ui";

test.beforeEach(async ({ page }) => {
  await stubClipboardForE2E(page);
  await mockAnalyzeApiForE2E(page);
});

test("home marketing hero visual baseline", async ({ page }) => {
  await resetE2ESessionStorage(page);
  await page.goto("/");

  const hero = page.getByTestId("home-marketing-hero");
  await expect(hero).toBeVisible();
  await expect(hero).toHaveScreenshot("home-marketing-hero.png", {
    maxDiffPixelRatio: 0.02,
  });
});

test("post-analyze scaffold panel visual baseline", async ({ page }) => {
  test.setTimeout(60_000);

  await resetE2ESessionStorage(page);
  await page.goto("/");
  await expect(page.getByTestId("home-marketing-hero")).toBeVisible();

  const samplePath = path.join(
    process.cwd(),
    "public",
    "references",
    "dashboard-reference.svg",
  );
  await page.locator('input[type="file"]').setInputFiles(samplePath);
  await expect(primaryAnalyzeButton(page)).toBeEnabled({ timeout: 10_000 });
  await primaryAnalyzeButton(page).click();

  await expect(page.getByText(/Generated scaffold/i)).toBeVisible({
    timeout: 15_000,
  });

  const scaffoldCard = page
    .getByText("Generated scaffold", { exact: true })
    .locator("xpath=ancestor::div[contains(@class,'group/card')][1]");
  await expect(scaffoldCard).toHaveScreenshot("post-analyze-scaffold-panel.png", {
    maxDiffPixelRatio: 0.03,
  });
});

test("design-system preview panel visual baseline", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/design-system?selected=shadcn-button", {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("searchbox", { name: /search catalog/i }).waitFor({
    state: "visible",
    timeout: 30_000,
  });
  await waitForDesignSystemPreview(page, 45_000);
  await expect(
    page.getByRole("searchbox", { name: /search catalog/i }),
  ).toBeVisible();

  const previewPanel = page.locator("#component-preview-panel");
  await expect(previewPanel).toBeVisible();
  // Wait for deferred preview chunk + selected component render before screenshot.
  await expect(previewPanel.getByText(/Preview|Export|Button/i).first()).toBeVisible({
    timeout: 30_000,
  });

  await expect(previewPanel).toHaveScreenshot("design-system-preview-panel.png", {
    maxDiffPixelRatio: 0.03,
    timeout: 30_000,
    animations: "disabled",
  });
});
