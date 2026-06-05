import { expect, test } from "@playwright/test";
import { expectNoCriticalA11yViolations } from "./helpers/a11y";
import {
  loadBundledSample,
  primaryAnalyzeButton,
  resetE2ESessionStorage,
  waitForDesignSystemPreview,
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

test("home has no critical a11y violations", async ({ page }) => {
  await resetE2ESessionStorage(page);
  await page.goto("/");
  await waitForUploadFlowReady(page);

  await expectNoCriticalA11yViolations(page);
});

test("design system has no critical a11y violations", async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto("/design-system?selected=shadcn-button", {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("searchbox", { name: /search catalog/i }).waitFor({
    state: "visible",
    timeout: 30_000,
  });
  await waitForDesignSystemPreview(page, 45_000);

  await expectNoCriticalA11yViolations(page);
});

test("post-analyze state has no critical a11y violations", async ({ page }) => {
  test.setTimeout(60_000);

  await resetE2ESessionStorage(page);
  await page.goto("/");
  await waitForUploadFlowReady(page);

  await loadBundledSample(page, "Dashboard");
  await expect(page.getByText(/dashboard-reference\.png/i)).toBeVisible();
  await expect(primaryAnalyzeButton(page)).toBeEnabled({ timeout: 10_000 });
  await primaryAnalyzeButton(page).click();

  await expect(page.getByText(/Generated scaffold/i)).toBeVisible({
    timeout: 15_000,
  });

  await expectNoCriticalA11yViolations(page);
});
