import { expect, test } from "@playwright/test";
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
  mode: "Local demo mode",
  file: "dashboard-reference.svg",
};

test.beforeEach(async ({ page }) => {
  await stubClipboardForE2E(page);
  await mockAnalyzeApiForE2E(page);
});

test("/share/[id] renders read-only summary from API-created link", async ({
  page,
  request,
}) => {
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
  await expect(page.getByText(shareFixturePayload.summary)).toBeVisible();
  await expect(page.getByText(shareFixturePayload.file)).toBeVisible();
  await expect(page.getByRole("link", { name: /try the live demo/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /one-click demo/i })).toHaveAttribute(
    "href",
    "/demo",
  );
});

test("/share/[id] returns 404 for unknown id", async ({ page }) => {
  const response = await page.goto("/share/ZZZZZZZZ");
  expect(response?.status()).toBe(404);
});
