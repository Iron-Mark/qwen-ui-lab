import { expect, test } from "@playwright/test";
import path from "node:path";
import {
  demoModeSnackbar,
  expectBundledSampleOptionCount,
  loadBundledSample,
  primaryAnalyzeButton,
  resetE2ESessionStorage,
  waitForUploadFlowReady,
} from "./helpers/e2e-ui";
import {
  mockAnalyzeApiForE2E,
  stubClipboardForE2E,
} from "./helpers/mock-analyze-api";

test.beforeEach(async ({ page }) => {
  await stubClipboardForE2E(page);
  await mockAnalyzeApiForE2E(page);
});

test("sample picker is visible and loads bundled reference", async ({ page }) => {
  await resetE2ESessionStorage(page);
  await page.goto("/");
  await waitForUploadFlowReady(page);

  const samplePicker = page.getByTestId("sample-picker");
  await expect(samplePicker).toBeVisible();
  await expect(samplePicker.getByTestId("sample-select")).toBeVisible();
  await expectBundledSampleOptionCount(page, 8);
  await expect(
    samplePicker.getByRole("button", { name: /load dashboard sample/i }),
  ).toBeVisible();

  await loadBundledSample(page, "Dashboard");
  await expect(page.getByText(/dashboard-reference\.(png|svg)/i)).toBeVisible({
    timeout: 15_000,
  });
  await expect(primaryAnalyzeButton(page)).toBeEnabled({ timeout: 10_000 });
});

test("upload flow completes analyze and generate on mobile", async ({ page }) => {
  test.setTimeout(60_000);

  await resetE2ESessionStorage(page);
  await page.goto("/");
  await waitForUploadFlowReady(page);

  const samplePath = path.join(
    process.cwd(),
    "public",
    "references",
    "mobile-reference.png",
  );
  await page.locator('input[type="file"]').setInputFiles(samplePath);

  await expect(primaryAnalyzeButton(page)).toBeEnabled({ timeout: 10_000 });
  await primaryAnalyzeButton(page).click();

  await expect(page.getByTestId("scaffold-export-panel")).toBeVisible({
    timeout: 15_000,
  });

  const livePreview = page.getByText("Live preview", { exact: true });
  await livePreview.scrollIntoViewIfNeeded();
  await expect(livePreview).toBeVisible();
  await expect(page.getByText("Sections", { exact: true })).toBeVisible();
});

test("startup does not show implementation status snackbar", async ({ page }) => {
  test.setTimeout(60_000);

  await resetE2ESessionStorage(page);
  await page.goto("/");
  await waitForUploadFlowReady(page);

  await expect(demoModeSnackbar(page)).toBeHidden({ timeout: 5_000 });
});
