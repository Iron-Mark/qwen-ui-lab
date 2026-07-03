import { expect, test } from "@playwright/test";
import {
  mockAnalyzeApiForE2E,
  stubClipboardForE2E,
} from "./helpers/mock-analyze-api";
import { resetE2ESessionStorage } from "./helpers/e2e-ui";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await stubClipboardForE2E(page);
  await mockAnalyzeApiForE2E(page);
});

function exportPanel(page: import("@playwright/test").Page) {
  return page.getByTestId("scaffold-export-panel");
}

test("/demo preloads dashboard and shows export panel", async ({ page }) => {
  test.setTimeout(60_000);

  await resetE2ESessionStorage(page);
  await page.goto("/demo");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(/dashboard sample/i);
  await expect(exportPanel(page)).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId("export-package-review")).toBeVisible();
  await expect(page.getByTestId("ux-compliance-archetype-links")).toBeVisible();
  await expect(page.getByTestId("ux-law-link-jakob")).toBeVisible();
});

test("/demo?archetype=auth loads sign-in component export", async ({ page }) => {
  test.setTimeout(60_000);

  await resetE2ESessionStorage(page);
  await page.goto("/demo?archetype=auth");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(/sign in/i);
  await expect(exportPanel(page)).toBeVisible({ timeout: 30_000 });
  await expect(
    page.locator("#upload-flow .break-words.font-medium").filter({
      hasText: /auth-reference\.(png|svg)/i,
    }),
  ).toBeVisible();
  await expect(page.getByTestId("ux-compliance-archetype-links")).toBeVisible();
  await expect(page.getByTestId("ux-law-link-fitts")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("export-package-review").click();
  const dialog = page.getByRole("dialog", { name: /review export package/i });
  await expect(dialog).toBeVisible();
  await dialog.getByText(/more export options/i).click();
  await dialog.getByRole("button", { name: /download component/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("starter-auth.tsx");
});

test("/demo?archetype=shop maps to ecommerce compliance links", async ({ page }) => {
  test.setTimeout(60_000);

  await resetE2ESessionStorage(page);
  await page.goto("/demo?archetype=shop");

  await expect(exportPanel(page)).toBeVisible({ timeout: 30_000 });
  await expect(
    page.locator("#upload-flow .break-words.font-medium").filter({
      hasText: /ecommerce-reference\.(png|svg)/i,
    }),
  ).toBeVisible();
  await expect(page.getByTestId("ux-compliance-archetype-links")).toBeVisible();
  await expect(page.getByTestId("ux-law-link-choice-overload")).toBeVisible();
});
