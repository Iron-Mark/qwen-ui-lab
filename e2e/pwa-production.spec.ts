import { expect, test } from "@playwright/test";

test.describe("PWA on production server", () => {
  test("manifest and offline shell are reachable", async ({ request }) => {
    const manifest = await request.get("/manifest.json");
    expect(manifest.ok()).toBeTruthy();
    const json = (await manifest.json()) as { display?: string; start_url?: string };
    expect(json.display).toBe("standalone");
    expect(json.start_url).toBe("/");

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
    expect(body).toContain("SKIP_WAITING");

    const cacheControl = sw.headers()["cache-control"] ?? "";
    expect(cacheControl.toLowerCase()).toMatch(/no-cache|no-store|must-revalidate/);
  });

  test("service worker registers on production host", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("home-marketing-hero")).toBeVisible({ timeout: 15_000 });

    const scriptUrl = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return null;
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      await navigator.serviceWorker.ready;
      return registration.active?.scriptURL ?? null;
    });

    expect(scriptUrl).toMatch(/\/sw\.js$/);
  });
});
