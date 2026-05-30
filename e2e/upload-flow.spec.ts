import { test, expect } from "@playwright/test";
import path from "node:path";
import {
  mockAnalyzeApiForE2E,
  stubClipboardForE2E,
} from "./helpers/mock-analyze-api";

// No live Qwen: route mocks + dev server env (see playwright.config.ts).
test.beforeEach(async ({ page }) => {
  await stubClipboardForE2E(page);
  await mockAnalyzeApiForE2E(page);
});

test("upload → analyze → generate → copy/export smoke flow", async ({
  page,
}) => {
  await page.goto("/");

  const samplePath = path.join(
    process.cwd(),
    "public",
    "references",
    "dashboard-reference.svg",
  );

  await page.locator('input[type="file"]').setInputFiles(samplePath);

  await expect(page.getByRole("button", { name: /^Analyze$/i })).toBeEnabled({
    timeout: 10_000,
  });

  await page.getByRole("button", { name: /^Analyze$/i }).click();

  await expect(
    page.getByText(/Demo analysis complete|Qwen analysis complete/i),
  ).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: /Generate Preview/i }).click();

  await expect(page.getByText(/Generated scaffold/i)).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText(/Live preview/i)).toBeVisible();

  await page.getByRole("button", { name: /^Copy code$/i }).click();
  await expect(page.getByText(/Scaffold copied/i)).toBeVisible({
    timeout: 5_000,
  });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /^Export code$/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("generated-dashboard.tsx");
});
