import { test, expect } from "@playwright/test";
import path from "node:path";
import {
  mockAnalyzeApiForE2E,
  stubClipboardForE2E,
} from "./helpers/mock-analyze-api";
import { waitForUploadFlowReady } from "./helpers/e2e-ui";

// No live Qwen: route mocks + dev server env (see playwright.config.ts).
test.beforeEach(async ({ page }) => {
  await stubClipboardForE2E(page);
  await mockAnalyzeApiForE2E(page);
});

test("upload → analyze → generate → copy/export smoke flow", async ({
  page,
}) => {
  await page.goto("/");
  await waitForUploadFlowReady(page);

  const samplePath = path.join(
    process.cwd(),
    "public",
    "references",
    "dashboard-reference.png",
  );

  await page.locator('input[type="file"]').setInputFiles(samplePath);

  const runPipeline = page.getByRole("button", {
    name: /analyze & generate preview|generate preview|regenerate preview/i,
  });

  await expect(runPipeline).toBeEnabled({ timeout: 10_000 });
  await runPipeline.click();

  await expect(page.getByText(/Generated scaffold/i)).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText(/Live preview/i)).toBeVisible();

  await page.getByRole("button", { name: /copy all code/i }).click();
  await expect(page.getByText(/Scaffold copied/i)).toBeVisible({
    timeout: 5_000,
  });

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("scaffold-export-panel").getByRole("button", { name: /download \.tsx code/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/generated-.*\.tsx$/);

  await page.getByTestId("gist-export-button").click();
  await expect(page.getByText(/Gist export unavailable/i)).toBeVisible({
    timeout: 5_000,
  });
});
