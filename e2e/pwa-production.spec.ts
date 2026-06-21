import { expect, test } from "@playwright/test";

async function expectHomeReady(page: import("@playwright/test").Page) {
  await expect(page.getByTestId("home-marketing-hero")).toBeVisible({
    timeout: 15_000,
  });
}

async function waitForControllingServiceWorker(page: import("@playwright/test").Page) {
  const controlled = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return false;

    await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    await navigator.serviceWorker.ready;

    if (navigator.serviceWorker.controller) return true;

    await new Promise<void>((resolve) => {
      const timeoutId = window.setTimeout(resolve, 3_000);
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => {
          window.clearTimeout(timeoutId);
          resolve();
        },
        { once: true },
      );
    });

    return Boolean(navigator.serviceWorker.controller);
  });

  if (controlled) return;

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), {
      timeout: 10_000,
    })
    .toBe(true);
}

test.describe("PWA on production server", () => {
  test("manifest and offline shell are reachable", async ({ request }) => {
    for (const manifestPath of ["/manifest.json", "/manifest.webmanifest"]) {
      const manifest = await request.get(manifestPath);
      expect(manifest.ok()).toBeTruthy();
      const json = (await manifest.json()) as {
        display?: string;
        screenshots?: unknown[];
        start_url?: string;
      };
      expect(json.display).toBe("standalone");
      expect(json.start_url).toBe("/");
      expect(json.screenshots?.length ?? 0).toBeGreaterThan(0);
    }

    const offline = await request.get("/offline.html");
    expect(offline.ok()).toBeTruthy();
    expect(await offline.text()).toMatch(/offline/i);
  });

  test("sw.js is versioned and not long-cached", async ({ request }) => {
    const sw = await request.get("/sw.js");
    expect(sw.ok()).toBeTruthy();
    const body = await sw.text();
    expect(body).toMatch(/CACHE_NAME\s*=\s*"qwen-ui-lab-v\d+"/);
    expect(body).toContain("offline.html");
    expect(body).toContain("/api/health");
    expect(body).toContain("SKIP_WAITING");
    expect(body).toContain("navigationPreload");

    const cacheControl = sw.headers()["cache-control"] ?? "";
    expect(cacheControl.toLowerCase()).toMatch(/no-cache|no-store|must-revalidate/);
  });

  test("service worker auto-registers on production host", async ({ page }) => {
    await page.goto("/");
    await expectHomeReady(page);

    const scriptUrl = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return null;

      return Promise.race([
        navigator.serviceWorker.ready.then(
          (registration) => registration.active?.scriptURL ?? null,
        ),
        new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 15_000)),
      ]);
    });

    expect(scriptUrl).toMatch(/\/sw\.js$/);
  });

  test("start_url launches from the service worker cache while offline", async ({
    context,
    page,
  }) => {
    await page.goto("/");
    await expectHomeReady(page);
    await waitForControllingServiceWorker(page);

    await page.reload({ waitUntil: "networkidle" });
    await expectHomeReady(page);

    await context.setOffline(true);
    try {
      const response = await page.goto("/", {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });

      expect(response, "offline start_url should resolve through the service worker").not.toBeNull();
      expect(response?.ok()).toBeTruthy();
      await expect(page.getByTestId("home-marketing-hero")).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await context.setOffline(false);
    }
  });
});
