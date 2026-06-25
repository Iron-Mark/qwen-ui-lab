import { expect, test } from "@playwright/test";
import path from "node:path";
import {
  mockAnalyzeApiForE2E,
  stubClipboardForE2E,
} from "./helpers/mock-analyze-api";
import {
  loadBundledSample,
  primaryAnalyzeButton,
  resetE2ESessionStorage,
  waitForDesignSystemPreview,
  waitForUploadFlowReady,
} from "./helpers/e2e-ui";

test.beforeEach(async ({ page }) => {
  await stubClipboardForE2E(page);
  await mockAnalyzeApiForE2E(page);
});

test("upload flow sample picker visual baseline", async ({ page }) => {
  await resetE2ESessionStorage(page);
  await page.goto("/");
  await waitForUploadFlowReady(page);

  const samplePicker = page.getByTestId("sample-picker");
  await expect(samplePicker).toBeVisible();
  await expect(samplePicker).toHaveScreenshot("upload-flow-sample-picker.png", {
    maxDiffPixelRatio: 0.02,
  });
});

test("home marketing hero visual baseline", async ({ page }) => {
  await resetE2ESessionStorage(page);
  await page.goto("/");
  await waitForUploadFlowReady(page);

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
  await waitForUploadFlowReady(page);

  const samplePath = path.join(
    process.cwd(),
    "public",
    "references",
    "dashboard-reference.png",
  );
  await page.locator('input[type="file"]').setInputFiles(samplePath);
  await expect(primaryAnalyzeButton(page)).toBeEnabled({ timeout: 10_000 });
  await primaryAnalyzeButton(page).click();

  await expect(page.getByText(/Generated component/i)).toBeVisible({
    timeout: 15_000,
  });

  const scaffoldCard = page
    .getByText("Generated component", { exact: true })
    .locator("xpath=ancestor::div[contains(@class,'group/card')][1]");
  await expect(scaffoldCard).toHaveScreenshot("post-analyze-scaffold-panel.png", {
    maxDiffPixelRatio: 0.03,
  });
});

const BUNDLED_SAMPLE_ARTIFACT_CASES = [
  { label: "Sign in", fileName: "auth-reference.png", screenshot: "post-analyze-auth-summary.png" },
  { label: "Mobile app", fileName: "mobile-reference.png", screenshot: "post-analyze-mobile-summary.png" },
  { label: "Landing page", fileName: "landing-reference.png", screenshot: "post-analyze-landing-summary.png" },
  { label: "Settings", fileName: "settings-reference.png", screenshot: "post-analyze-settings-summary.png" },
  { label: "Shop catalog", fileName: "ecommerce-reference.png", screenshot: "post-analyze-ecommerce-summary.png" },
] as const;

for (const sampleCase of BUNDLED_SAMPLE_ARTIFACT_CASES) {
  test(`post-analyze summary for ${sampleCase.label} sample`, async ({ page }) => {
    test.setTimeout(60_000);

    await resetE2ESessionStorage(page);
    await page.goto("/");
    await waitForUploadFlowReady(page);

    await loadBundledSample(page, sampleCase.label);
    await expect(page.getByText(new RegExp(sampleCase.fileName, "i"))).toBeVisible();
    await expect(primaryAnalyzeButton(page)).toBeEnabled({ timeout: 10_000 });
    await primaryAnalyzeButton(page).click();

    await expect(page.getByText(/Generated component/i)).toBeVisible({
      timeout: 15_000,
    });

    const summaryCard = page
      .getByText("Layout Read", { exact: true })
      .locator("xpath=ancestor::div[contains(@class,'group/card')][1]");
    await expect(summaryCard).toHaveScreenshot(sampleCase.screenshot, {
      maxDiffPixelRatio: 0.03,
    });
  });
}

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
  // Selected entry (shadcn-button) should be rendered inside the preview host.
  await expect(
    previewPanel.locator('[aria-label="Component preview"] button').first(),
  ).toBeVisible({ timeout: 30_000 });

  await expect(previewPanel).toHaveScreenshot("design-system-preview-panel.png", {
    maxDiffPixelRatio: 0.03,
    timeout: 30_000,
    animations: "disabled",
  });
});
