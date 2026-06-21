import { expect, type Locator, type Page } from "@playwright/test";

/** Mirrors app sessionStorage keys — keep in sync with UI code. */
export const DEMO_SNACKBAR_SESSION_KEY = "qwen-ui-lab:demo-mode-snackbar-shown";
export const SAMPLE_USED_SESSION_KEY = "qwen-ui-lab:upload-sample-used";
export const AUTH_SESSION_KEY = "qwen-ui-lab:auth";
export const SESSION_HISTORY_KEY = "qwen-ui-lab:sessions";

const E2E_SESSION_KEYS = [
  DEMO_SNACKBAR_SESSION_KEY,
  SAMPLE_USED_SESSION_KEY,
  AUTH_SESSION_KEY,
] as const;

const E2E_LOCAL_KEYS = [SESSION_HISTORY_KEY] as const;

/**
 * Clears demo session keys once (not on every reload).
 * addInitScript would re-run on reload and break "once per session" assertions.
 */
export async function resetE2ESessionStorage(page: Page) {
  await page.goto("about:blank");
  await page.evaluate(
    ({
      sessionKeys,
      localKeys,
    }: {
      sessionKeys: string[];
      localKeys: string[];
    }) => {
      for (const key of sessionKeys) {
        try {
          sessionStorage.removeItem(key);
        } catch {
          // ignore
        }
      }
      for (const key of localKeys) {
        try {
          localStorage.removeItem(key);
        } catch {
          // ignore
        }
      }
    },
    { sessionKeys: [...E2E_SESSION_KEYS], localKeys: [...E2E_LOCAL_KEYS] },
  );
}

/** LazyToaster mounts after hydration; Sonner toasts need this container. */
export async function waitForSonnerToaster(page: Page, timeoutMs = 25_000) {
  const toaster = page.locator("[data-sonner-toaster]");
  await toaster.waitFor({
    state: "attached",
    timeout: timeoutMs,
  });
  // Sonner may attach before layout/position attributes are applied.
  await expect
    .poll(
      async () => {
        const count = await toaster.count();
        if (count === 0) return null;
        const x = await toaster.getAttribute("data-x-position");
        const y = await toaster.getAttribute("data-y-position");
        return x && y ? `${x}:${y}` : null;
      },
      { timeout: Math.min(timeoutMs, 10_000), intervals: [100, 250, 500] },
    )
    .not.toBeNull();
}

/** Wait until visible Sonner toast titles meet WCAG AA contrast (avoids theme/animation flakes). */
export async function waitForSonnerToastContrast(page: Page, timeoutMs = 15_000) {
  let stablePasses = 0;
  await expect
    .poll(
      async () => {
        const passes = await page.evaluate(() => {
          const MIN_RATIO = 4.5;

          const parseRgb = (color: string) => {
            const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (!match) return null;
            return [Number(match[1]), Number(match[2]), Number(match[3])] as const;
          };

          const luminance = ([r, g, b]: readonly [number, number, number]) => {
            const channel = (v: number) => {
              const s = v / 255;
              return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
            };
            return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
          };

          const contrastRatio = (fg: string, bg: string) => {
            const fgRgb = parseRgb(fg);
            const bgRgb = parseRgb(bg);
            if (!fgRgb || !bgRgb) return null;
            const l1 = luminance(fgRgb) + 0.05;
            const l2 = luminance(bgRgb) + 0.05;
            return l1 > l2 ? l1 / l2 : l2 / l1;
          };

          const titles = document.querySelectorAll(
            '[data-sonner-toast][data-visible="true"] [data-title]',
          );
          if (titles.length === 0) return true;

          for (const title of titles) {
            const toast = title.closest("[data-sonner-toast]");
            if (!(toast instanceof HTMLElement)) continue;
            const ratio = contrastRatio(
              getComputedStyle(title).color,
              getComputedStyle(toast).backgroundColor,
            );
            if (ratio === null || ratio < MIN_RATIO) return false;
          }
          return true;
        });
        stablePasses = passes ? stablePasses + 1 : 0;
        return stablePasses >= 2;
      },
      { timeout: timeoutMs, intervals: [100, 250, 500] },
    )
    .toBe(true);
}

/** Home upload flow is client-rendered; wait before file picker interactions. */
export async function waitForUploadFlowReady(page: Page, timeoutMs = 20_000) {
  await expect(page.getByTestId("home-marketing-hero")).toBeVisible({ timeout: timeoutMs });
  await expect(page.locator('input[type="file"]')).toBeAttached({ timeout: timeoutMs });
}

/** Bottom-left demo snackbar should clear the sticky header and stay in viewport. */
export async function expectDemoSnackbarInViewport(
  page: Page,
  snackbar: Locator,
  options?: { headerClearancePx?: number; timeoutMs?: number },
) {
  const headerClearancePx = options?.headerClearancePx ?? 64;
  const timeoutMs = options?.timeoutMs ?? 10_000;

  await expect
    .poll(
      async () => {
        const box = await snackbar.boundingBox();
        const viewport = page.viewportSize();
        if (!box || !viewport) return false;
        return (
          box.y > headerClearancePx &&
          box.x < viewport.width * 0.5 &&
          box.x + box.width <= viewport.width + 4 &&
          box.y + box.height <= viewport.height + 4
        );
      },
      { timeout: timeoutMs, intervals: [100, 250, 500] },
    )
    .toBe(true);
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
  await picker.getByTestId("sample-select").selectOption({ label });
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
