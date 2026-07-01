import { expect, test } from "@playwright/test";
import {
  demoModeSnackbar,
  designSystemTierButton,
  waitForDesignSystemPreview,
  loadBundledSample,
  primaryAnalyzeButton,
  resetE2ESessionStorage,
} from "./helpers/e2e-ui";
import {
  mockAnalyzeApiForE2E,
  stubClipboardForE2E,
} from "./helpers/mock-analyze-api";

test.beforeEach(async ({ page }) => {
  await stubClipboardForE2E(page);
  await mockAnalyzeApiForE2E(page);
});

test("switches between light and dark themes", async ({ page }) => {
  await page.goto("/");

  const root = page.locator("html");

  const wasDark = await root.evaluate((el) => el.classList.contains("dark"));
  await page.getByRole("button", { name: /appearance settings/i }).click();
  await page.getByRole("menuitem", { name: /switch to (dark|light) mode/i }).click();

  if (wasDark) {
    await expect(root).not.toHaveClass(/dark/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("theme"))).toBe(
      "light",
    );
  } else {
    await expect(root).toHaveClass(/dark/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("theme"))).toBe(
      "dark",
    );
  }
});

test("switches brand theme and persists selection", async ({ page }) => {
  await resetE2ESessionStorage(page);
  await page.goto("/");

  await page.getByRole("button", { name: /appearance settings/i }).click();
  await expect(page.getByRole("menuitemradio", { name: /emerald/i })).toBeVisible();
  await page.getByRole("menuitemradio", { name: /emerald/i }).click();

  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.brand)).toBe(
    "emerald",
  );
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("brand-theme")))
    .toBe("emerald");
});

test("filters and searches in design system catalog", async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto("/design-system", { waitUntil: "domcontentloaded" });
  await page.getByRole("searchbox", { name: /search catalog/i }).waitFor({
    state: "visible",
    timeout: 30_000,
  });

  const visibleMetric = page.locator("header").getByText(/\d+\s+visible/i);
  await expect(visibleMetric).toBeVisible({ timeout: 15_000 });

  await page.getByRole("searchbox", { name: /search catalog/i }).fill("zzzz-no-match");
  await expect(page.getByText("No components match your search.")).toBeVisible();
  await expect(visibleMetric).toHaveText(/0\s+visible/i);

  await page.getByRole("searchbox", { name: /search catalog/i }).fill("button");
  await expect(page.getByText("No components match your search.")).toBeHidden();
  await expect(visibleMetric).not.toHaveText(/0\s+visible/i);

  await designSystemTierButton(page, "molecule").click();
  await expect.poll(() => page.url(), { timeout: 15_000 }).toMatch(/level=molecule/);
});

test("runs deterministic local analysis flow", async ({ page }) => {
  await resetE2ESessionStorage(page);
  await page.goto("/");

  const samplePicker = page.getByTestId("sample-picker");
  await expect(samplePicker).toBeVisible();
  await loadBundledSample(page, "Dashboard");

  await expect(page.getByText(/dashboard-reference\.png/i)).toBeVisible();
  await expect(primaryAnalyzeButton(page)).toBeEnabled({ timeout: 10_000 });

  await primaryAnalyzeButton(page).click();
  await expect(
    page.getByRole("status").filter({ hasText: /Ready to analyze|Analysis complete/i }).first(),
  ).toBeVisible();
  await expect(page.getByText(/Preview ready/i)).toBeVisible({ timeout: 15_000 });
});

test("supports dashboard and design-system exports", async ({ page }) => {
  test.setTimeout(60_000);

  await resetE2ESessionStorage(page);
  await page.goto("/");

  await loadBundledSample(page, "Dashboard");
  await expect(page.getByText(/dashboard-reference\.png/i)).toBeVisible();
  await expect(primaryAnalyzeButton(page)).toBeEnabled({ timeout: 10_000 });
  await primaryAnalyzeButton(page).click();
  await expect(page.getByText(/Generated component/i)).toBeVisible();

  const complianceTrigger = page.getByTestId("ux-compliance-details-trigger");
  await expect(complianceTrigger).toBeVisible();
  await expect(complianceTrigger).toContainText(/\d+ met · \d+ partial · \d+ review/);
  await complianceTrigger.click();
  const complianceDialog = page.getByRole("dialog", { name: /laws of ux compliance/i });
  await expect(complianceDialog).toBeVisible();
  await expect(complianceDialog.getByText(/Fitts's Law/i)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(complianceDialog).toBeHidden();

  await page.getByTestId("export-package-review").click();
  const exportDialog = page.getByRole("dialog", { name: /review export package/i });
  await expect(exportDialog).toBeVisible();
  const dashboardDownloadPromise = page.waitForEvent("download");
  await exportDialog.getByRole("button", { name: /download component/i }).click();
  const dashboardDownload = await dashboardDownloadPromise;
  expect(dashboardDownload.suggestedFilename()).toMatch(/generated-.*\.tsx$/);

  await page.goto("/design-system", { waitUntil: "domcontentloaded", timeout: 45_000 });
  await expect(page.getByRole("searchbox", { name: /search catalog/i })).toBeVisible({
    timeout: 15_000,
  });
  const snippetDownloadPromise = page.waitForEvent("download");
  await page
    .getByRole("region", { name: /button \(shadcn\) snippet/i })
    .getByRole("button", { name: /export code/i })
    .click();
  const snippetDownload = await snippetDownloadPromise;
  expect(snippetDownload.suggestedFilename()).toMatch(/button.*\.tsx$/i);
});

test("does not show startup implementation notice", async ({ page }) => {
  test.setTimeout(60_000);

  await resetE2ESessionStorage(page);
  await page.goto("/");

  await expect(demoModeSnackbar(page)).toBeHidden({ timeout: 5_000 });
});

test("design system desktop has no excess document scroll", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  await stubClipboardForE2E(page);
  await mockAnalyzeApiForE2E(page);

  await page.goto("/design-system?selected=shadcn-button", {
    waitUntil: "domcontentloaded",
  });
  await waitForDesignSystemPreview(page);

  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const doc = document.documentElement;
          return doc.scrollHeight - document.body.scrollHeight;
        }),
      { timeout: 20_000 },
    )
    .toBeLessThan(50);

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      slack: doc.scrollHeight - window.innerHeight,
      scrollHeight: doc.scrollHeight,
    };
  });

  expect(metrics.scrollHeight).toBeLessThan(1800);
  expect(metrics.slack).toBeLessThan(700);

  await context.close();
});

test("design system scrolls to preview on mobile selection", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  await stubClipboardForE2E(page);
  await mockAnalyzeApiForE2E(page);

  await page.goto("/design-system");
  await waitForDesignSystemPreview(page);

  const previewPanel = page.locator("#component-preview-panel");

  // Change selection after initial mount to trigger the mobile scroll behavior.
  const listPanel = page
    .getByText("Component list", { exact: true })
    .locator("xpath=ancestor::section[1]");
  const listButtons = listPanel.getByRole("button");
  await expect(listButtons.first()).toBeVisible();
  await listButtons.nth(1).click();

  await expect(page).toHaveURL(/selected=/);

  await expect
    .poll(
      async () => {
        const box = await previewPanel.boundingBox();
        if (!box) return null;
        const viewport = page.viewportSize();
        if (!viewport) return null;
        // Scrolled into view when the panel top sits in the upper ~70% of the viewport.
        return box.y >= 0 && box.y < viewport.height * 0.7;
      },
      { timeout: 15_000 },
    )
    .toBeTruthy();

  await context.close();
});

test.describe("marketing surfaces", () => {
  test("home hero, growth snippet, and primary CTAs are visible", async ({ page }) => {
    await page.goto("/");

    const hero = page.getByTestId("home-marketing-hero");
    await expect(hero).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /screenshot/i,
    );
    await expect(hero.locator(".growth-snippet")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /start workflow/i }),
    ).toHaveAttribute("href", "/#upload-flow");
    await expect(
      page.getByRole("link", { name: /browse components/i }),
    ).toHaveAttribute("href", "/design-system");
    await expect(page.getByLabel("Trust signals")).toBeVisible();
    await expect(page.getByLabel("Key benefits")).toBeVisible();
  });

  test("home metadata is present and non-empty", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/qwen-ui-lab/i);
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute("content", /.+/);
    const content = await description.getAttribute("content");
    expect(content?.length ?? 0).toBeGreaterThan(40);

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      /.+/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /.+/,
    );
  });

  test("header design-system link navigates to catalog", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: /design system/i })
      .click();
    await expect(page).toHaveURL(/\/design-system/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /component library/i,
    );
  });

  test("sitemap and manifest are reachable", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    const body = await sitemap.text();
    expect(body).toContain("/design-system");

    const manifest = await request.get("/manifest.json");
    expect(manifest.ok()).toBeTruthy();
    const json = (await manifest.json()) as {
      name?: string;
      start_url?: string;
      scope?: string;
      display?: string;
    };
    expect(json.name).toMatch(/qwen-ui-lab/i);
    expect(json.start_url).toBe("/");
    expect(json.scope).toBe("/");
    expect(json.display).toBe("standalone");
  });

  test("PWA assets are reachable", async ({ request }) => {
    const sw = await request.get("/sw.js");
    expect(sw.ok()).toBeTruthy();
    const swBody = await sw.text();
    expect(swBody).toContain("offline.html");
    expect(swBody).toContain("/api/health");

    const offline = await request.get("/offline.html");
    expect(offline.ok()).toBeTruthy();
    expect(await offline.text()).toMatch(/offline/i);
  });

  test("install banner responds to beforeinstallprompt", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("qwen-ui-lab:pwa-install-dismissed");
    });

    await page.goto("/");
    await expect(page.getByTestId("home-marketing-hero")).toBeVisible({ timeout: 15_000 });

    await expect
      .poll(
        () =>
          page.evaluate(() => {
            class MockBeforeInstallPrompt extends Event {
              prompt() {
                return Promise.resolve();
              }
              userChoice = Promise.resolve({ outcome: "dismissed" as const });
            }
            window.dispatchEvent(new MockBeforeInstallPrompt("beforeinstallprompt"));
            return Boolean(document.querySelector('[data-testid="pwa-install-banner"]'));
          }),
        { timeout: 5_000, intervals: [100, 250, 500] },
      )
      .toBe(true);

    await expect(page.getByTestId("pwa-install-banner")).toBeVisible({
      timeout: 5_000,
    });
    await page.getByRole("button", { name: /dismiss install banner/i }).click();
    await expect(page.getByTestId("pwa-install-banner")).toBeHidden();
  });
});

test("preview segmented tabs switch modes", async ({ page }) => {
  await page.goto("/design-system");
  await waitForDesignSystemPreview(page);

  await page.getByRole("tab", { name: /mobile preview/i }).click();
  await expect(page).toHaveURL(/preview=mobile/);

  await page.getByRole("tab", { name: /desktop preview/i }).click();
  // Desktop is the default mode; query params omit defaults.
  await expect.poll(() => page.url()).not.toContain("preview=mobile");
});
