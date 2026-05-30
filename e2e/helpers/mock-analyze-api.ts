import type { Page } from "@playwright/test";

/** Matches GET /api/health in demo mode — forces instant offline analyze. */
export const E2E_HEALTH_JSON = {
  ok: true,
  provider: "demo",
  hasApiKey: false,
  liveAnalysisEnabled: false,
  model: null,
  baseUrl: null,
} as const;

/**
 * Intercept analyze API routes so E2E never calls Qwen, regardless of .env.local or CI secrets.
 * Health mock → client skips POST /api/analyze-ui; analyze-ui mock is a safety net.
 */
/** Headless Chromium often lacks a working clipboard API; stub so Copy/Export succeed. */
export async function stubClipboardForE2E(page: Page) {
  await page.addInitScript(() => {
    const writeText = async () => {};
    if (navigator.clipboard) {
      navigator.clipboard.writeText = writeText;
    } else {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText, readText: async () => "" },
      });
    }
  });
}

export async function mockAnalyzeApiForE2E(page: Page) {
  await page.route("**/api/health", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(E2E_HEALTH_JSON),
    });
  });

  await page.route("**/api/analyze-ui", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        code: "missing_qwen_api_key",
        message: "E2E mock — live Qwen disabled",
      }),
    });
  });
}
