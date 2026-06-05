import { expect, test } from "@playwright/test";
import {
  E2E_LIVE_ARTIFACT,
  prepareLiveQwenContractPage,
} from "./helpers/mock-live-qwen-api";
import {
  loadBundledSample,
  primaryAnalyzeButton,
  resetE2ESessionStorage,
} from "./helpers/e2e-ui";

test.beforeEach(async ({ page }) => {
  await prepareLiveQwenContractPage(page);
});

test("live mode POSTs /api/analyze-ui and renders mocked Qwen artifact", async ({
  page,
}) => {
  const analyzePosts: string[] = [];

  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      request.url().includes("/api/analyze-ui")
    ) {
      analyzePosts.push(request.url());
    }
  });

  await resetE2ESessionStorage(page);
  await page.goto("/");
  await expect(page.getByTestId("home-marketing-hero")).toBeVisible();

  await loadBundledSample(page, "Dashboard");
  await expect(page.getByText(/dashboard-reference\.png/i)).toBeVisible();
  await expect(primaryAnalyzeButton(page)).toBeEnabled({ timeout: 10_000 });
  await primaryAnalyzeButton(page).click();

  await expect(
    page.getByText(E2E_LIVE_ARTIFACT.planTitles[0], { exact: true }),
  ).toBeVisible({ timeout: 20_000 });

  expect(analyzePosts.length).toBeGreaterThan(0);
  await expect(
    page.getByText(E2E_LIVE_ARTIFACT.modeLabel, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(E2E_LIVE_ARTIFACT.previewStats[0].value, { exact: true }).first(),
  ).toBeVisible();
});
