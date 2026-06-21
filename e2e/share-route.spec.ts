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
  detections: {
    source: { width: 1440, height: 900 },
    designTokens: {
      surface: "#ffffff",
      foreground: "#111827",
      accent: "#2563eb",
      accentForeground: "#ffffff",
      muted: "#f3f4f6",
      border: "#d1d5db",
    },
    quality: {
      confidence: 0.74,
      ambiguity: "low",
      strategy: "fine-grid-connected-components",
      elementCount: 2,
    },
    elements: [
      {
        id: "element-1",
        kind: "header",
        primitive: "header",
        confidence: 0.9,
        included: true,
        userEdited: false,
        box: { x: 0, y: 0, width: 1440, height: 112 },
      },
      {
        id: "element-2",
        kind: "button-or-input",
        primitive: "field-or-action",
        confidence: 0.7,
        included: false,
        userEdited: true,
        box: { x: 120, y: 225, width: 360, height: 90 },
      },
    ],
  },
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
  await expect(page.getByTestId("shared-detection-preview")).toBeVisible();
  await expect(page.getByTestId("shared-detection-element")).toHaveCount(1);
  await expect(
    page.locator('[data-testid="shared-detection-element"][data-detection-id="element-2"]'),
  ).toHaveCount(0);
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
