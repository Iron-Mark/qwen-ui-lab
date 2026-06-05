import { expect, test } from "@playwright/test";
import {
  E2E_SAMPLE_ARTIFACT,
  mockAnalyzeApiForE2E,
  stubClipboardForE2E,
} from "./helpers/mock-analyze-api";
import {
  loadBundledSample,
  primaryAnalyzeButton,
  resetE2ESessionStorage,
} from "./helpers/e2e-ui";

test.beforeEach(async ({ page }) => {
  await stubClipboardForE2E(page);
  await mockAnalyzeApiForE2E(page);
});

test("demo mode skips POST /api/analyze-ui entirely", async ({ page }) => {
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

  await expect(page.getByText(/Generated scaffold|Preview ready/i)).toBeVisible({
    timeout: 15_000,
  });

  expect(analyzePosts).toHaveLength(0);
});

test("sample upload produces deterministic offline artifact content", async ({
  page,
}) => {
  await resetE2ESessionStorage(page);
  await page.goto("/");
  await expect(page.getByTestId("home-marketing-hero")).toBeVisible();

  await loadBundledSample(page, "Dashboard");
  await expect(primaryAnalyzeButton(page)).toBeEnabled({ timeout: 10_000 });
  await primaryAnalyzeButton(page).click();

  await expect(page.getByText(/Generated scaffold/i)).toBeVisible({
    timeout: 15_000,
  });

  await expect(page.getByText("Layout Read", { exact: true })).toBeVisible();
  await expect(page.getByText("Component Map", { exact: true })).toBeVisible();
  await expect(page.getByText("Sections", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(E2E_SAMPLE_ARTIFACT.previewStats[0].value, { exact: true }).first()).toBeVisible();
});

test("offline demo completes when health fetch fails", async ({ page }) => {
  await page.unroute("**/api/health");
  await page.route("**/api/health", async (route) => {
    await route.abort("failed");
  });

  await resetE2ESessionStorage(page);
  await page.goto("/");
  await expect(page.getByTestId("home-marketing-hero")).toBeVisible();

  await loadBundledSample(page, "Dashboard");
  await expect(primaryAnalyzeButton(page)).toBeEnabled({ timeout: 10_000 });
  await primaryAnalyzeButton(page).click();

  await expect(
    page.getByText(/Generated scaffold|Preview ready|offline demo/i).first(),
  ).toBeVisible({
    timeout: 20_000,
  });
});
