import liveFixtures from "../fixtures/live-qwen-responses.json" with { type: "json" };
import type { Page } from "@playwright/test";
import { stubClipboardForE2E } from "./mock-analyze-api";

export const E2E_LIVE_HEALTH_JSON = liveFixtures.health;
export const E2E_LIVE_ANALYZE_SUCCESS = liveFixtures.analyzeUiSuccess;
export const E2E_LIVE_ARTIFACT = liveFixtures.artifactContract;

/**
 * Live-path test doubles: health reports liveAnalysisEnabled, analyze-ui returns a
 * structured Qwen artifact. No DashScope credentials or upstream calls in CI.
 */
export async function mockLiveQwenAnalyzeApiForE2E(page: Page) {
  await page.route("**/api/health", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(E2E_LIVE_HEALTH_JSON),
    });
  });

  await page.route("**/api/analyze-ui", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(E2E_LIVE_ANALYZE_SUCCESS),
    });
  });
}

/** SW network-first on /api/health can bypass Playwright route mocks. */
export async function blockServiceWorkerForE2E(page: Page) {
  await page.addInitScript(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        void registration.unregister();
      }
    });
    Object.defineProperty(navigator.serviceWorker, "register", {
      configurable: true,
      value: async () => {
        throw new Error("service worker disabled for E2E");
      },
    });
  });
}

export async function prepareLiveQwenContractPage(page: Page) {
  await blockServiceWorkerForE2E(page);
  await stubClipboardForE2E(page);
  await mockLiveQwenAnalyzeApiForE2E(page);
}
