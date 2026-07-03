import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./helpers/a11y";
import {
  loadSampleRun,
  primaryAnalyzeButton,
  resetE2ESessionStorage,
  waitForDesignSystemPreview,
  waitForSonnerToaster,
  waitForSonnerToastContrast,
  waitForUploadFlowReady,
} from "./helpers/e2e-ui";
import {
  mockAnalyzeApiForE2E,
  stubClipboardForE2E,
} from "./helpers/mock-analyze-api";

const shareFixturePayload = {
  v: 1 as const,
  summary: "Admin dashboard with stat grid and activity rail.",
  stats: [
    { l: "Components", v: "6" },
    { l: "Sections", v: "4" },
  ],
  mode: "Ready to analyze",
  file: "dashboard-reference.svg",
};

test.beforeEach(async ({ page }) => {
  await stubClipboardForE2E(page);
  await mockAnalyzeApiForE2E(page);
});

test("home has no serious a11y violations", async ({ page }) => {
  await resetE2ESessionStorage(page);
  await page.goto("/");
  await waitForUploadFlowReady(page);

  await expectNoSeriousA11yViolations(page);
});

test("design system has no serious a11y violations", async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto("/design-system?selected=shadcn-button", {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("searchbox", { name: /search catalog/i }).waitFor({
    state: "visible",
    timeout: 30_000,
  });
  await waitForDesignSystemPreview(page, 45_000);

  await expectNoSeriousA11yViolations(page);
});

test("sample run route has no serious a11y violations", async ({ page }) => {
  test.setTimeout(60_000);

  await resetE2ESessionStorage(page);
  await page.goto("/demo");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /dashboard layout/i,
  );
  await expect(page.getByTestId("scaffold-export-panel")).toBeVisible({
    timeout: 20_000,
  });

  await waitForSonnerToaster(page);
  await expect
    .poll(
      async () => {
        const toasterTheme = await page
          .locator("[data-sonner-toaster]")
          .getAttribute("data-sonner-theme");
        if (toasterTheme !== "light" && toasterTheme !== "dark") return null;
        const htmlDark = await page.evaluate(() =>
          document.documentElement.classList.contains("dark"),
        );
        return (toasterTheme === "dark") === htmlDark ? toasterTheme : null;
      },
      { timeout: 15_000, intervals: [100, 250, 500] },
    )
    .toMatch(/^(light|dark)$/);
  await waitForSonnerToastContrast(page);

  await expectNoSeriousA11yViolations(page, {
    exclude: ["[data-sonner-toaster]"],
  });
});

test("share page has no serious a11y violations", async ({ page, request }) => {
  test.setTimeout(60_000);

  const createResponse = await request.post("/api/share", {
    data: shareFixturePayload,
  });
  expect(createResponse.ok()).toBeTruthy();
  const { id } = (await createResponse.json()) as { id: string };

  await page.goto(`/share/${id}`);

  await expect(
    page.getByRole("heading", { level: 1, name: /read-only analysis summary/i }),
  ).toBeVisible();
  await expect(page.getByTestId("shared-result-summary")).toBeVisible();

  await expectNoSeriousA11yViolations(page);
});

test("post-analyze state has no serious a11y violations", async ({ page }) => {
  test.setTimeout(60_000);

  await resetE2ESessionStorage(page);
  await page.goto("/");
  await waitForUploadFlowReady(page);

  await loadSampleRun(page, "Dashboard");
  await expect(page.getByText(/dashboard-reference\.png/i)).toBeVisible();
  await expect(primaryAnalyzeButton(page)).toBeEnabled({ timeout: 10_000 });
  await primaryAnalyzeButton(page).click();

  await expect(page.getByTestId("scaffold-export-panel")).toBeVisible({
    timeout: 15_000,
  });

  await waitForSonnerToastContrast(page);
  await expectNoSeriousA11yViolations(page);
});
