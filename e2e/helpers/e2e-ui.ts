import { expect, type Locator, type Page } from "@playwright/test";

/** Mirrors app sessionStorage keys — keep in sync with UI code. */
export const DEMO_SNACKBAR_SESSION_KEY = "qwen-ui-lab:demo-mode-snackbar-shown";
export const SAMPLE_USED_SESSION_KEY = "qwen-ui-lab:upload-sample-used";

const E2E_SESSION_KEYS = [DEMO_SNACKBAR_SESSION_KEY, SAMPLE_USED_SESSION_KEY] as const;

/**
 * Clears demo session keys once (not on every reload).
 * addInitScript would re-run on reload and break "once per session" assertions.
 */
export async function resetE2ESessionStorage(page: Page) {
  await page.goto("about:blank");
  await page.evaluate((keys: string[]) => {
    for (const key of keys) {
      try {
        sessionStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
  }, [...E2E_SESSION_KEYS]);
}

/** LazyToaster mounts after hydration; Sonner toasts need this container. */
export async function waitForSonnerToaster(page: Page, timeoutMs = 15_000) {
  await page.locator("[data-sonner-toaster]").waitFor({
    state: "attached",
    timeout: timeoutMs,
  });
}

export function demoModeSnackbar(page: Page): Locator {
  return page
    .getByRole("status")
    .filter({ hasText: /demo mode.*safe for live demos/i })
    .first();
}

/** Load a bundled reference from the upload-flow sample picker. */
export async function loadBundledSample(page: Page, label: string) {
  const picker = page.getByTestId("sample-picker");
  await expect(picker).toBeVisible();
  await picker.getByRole("button", { name: new RegExp(`load ${label} sample`, "i") }).click();
}

/** Combined analyze CTA (experiment may use "now" suffix). */
export function primaryAnalyzeButton(page: Page): Locator {
  return page.getByRole("button", {
    name: /analyze & generate(?:\s+now|\s+preview)?|generate preview|regenerate preview/i,
  });
}

export async function expectDemoSnackbarSessionFlag(page: Page, value: "0" | "1") {
  await expect
    .poll(() =>
      page.evaluate((key) => sessionStorage.getItem(key), DEMO_SNACKBAR_SESSION_KEY),
    )
    .toBe(value === "1" ? "1" : null);
}

/** Waits for idle-deferred DesignSystemPreview (LCP path uses a skeleton first). */
export async function waitForDesignSystemPreview(page: Page, timeoutMs = 20_000) {
  const previewPanel = page.locator("#component-preview-panel");
  await previewPanel.waitFor({
    state: "visible",
    timeout: timeoutMs,
  });

  // Ensure IntersectionObserver in ComponentPreviewCard (deferPreview) can fire.
  await previewPanel.scrollIntoViewIfNeeded();

  // deferPreview renders an animate-pulse placeholder until the host intersects.
  const deferredPreviewSkeleton = previewPanel.locator(
    '[aria-label="Component preview"] .animate-pulse[aria-hidden="true"]',
  );
  await expect(deferredPreviewSkeleton).toHaveCount(0, { timeout: timeoutMs });
}

/** Tier filter in the design-system header (not catalog list badges). */
export function designSystemTierButton(page: Page, tier: string): Locator {
  return page
    .locator("header")
    .filter({ has: page.getByText("Tier", { exact: true }) })
    .getByRole("button", { name: new RegExp(`^${tier}$`, "i") });
}
