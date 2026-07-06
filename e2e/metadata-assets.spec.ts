import { expect, test } from "@playwright/test";

function pngSize(buffer: Buffer) {
  expect(buffer.readUInt32BE(0)).toBe(0x89504e47);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test("home head exposes crawler and install metadata", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/qwen-ui-lab/i);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /React \+ Tailwind export package/,
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    /React \+ Tailwind export package/,
  );
  await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute(
    "content",
    /React \+ Tailwind export package/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /^https?:\/\/[^/]+\/?$/,
  );
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    /manifest\.webmanifest$/,
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    /apple-touch-icon\.png/,
  );
  await expect(page.locator('link[rel="mask-icon"]')).toHaveAttribute(
    "href",
    /icon-maskable\.svg/,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /\/social\/home-social-preview-1200x630\.png$/,
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    "content",
    /\/social\/home-social-preview-1200x630\.png$/,
  );
});

test("robots, sitemap, manifest, and icons are reachable", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  expect(robots.headers()["content-type"]).toMatch(/text\/plain/);
  const robotsText = await robots.text();
  expect(robotsText).toContain("User-Agent: *");
  expect(robotsText).toContain("Disallow: /api/");
  expect(robotsText).toContain("Sitemap:");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  expect(sitemap.headers()["content-type"]).toMatch(/xml/);
  const sitemapText = await sitemap.text();
  expect(sitemapText).toMatch(/<loc>https?:\/\/[^<]+\/<\/loc>/);
  expect(sitemapText).toContain("/design-system");

  for (const manifestPath of ["/manifest.json", "/manifest.webmanifest"]) {
    const manifest = await request.get(manifestPath);
    expect(manifest.ok()).toBeTruthy();
    expect(manifest.headers()["content-type"]).toMatch(/manifest|json/);
    const json = (await manifest.json()) as {
      description?: string;
      display?: string;
      display_override?: string[];
      icons?: Array<{ src?: string; sizes?: string; purpose?: string; type?: string }>;
      screenshots?: Array<{ src?: string; sizes?: string; form_factor?: string; label?: string }>;
      shortcuts?: Array<{ description?: string; name?: string; url?: string }>;
      start_url?: string;
    };
    expect(json.start_url).toBe("/");
    expect(json.description).toBe("Screenshot-to-React workflow with inspectable export packages.");
    expect(json.display).toBe("standalone");
    expect(json.display_override).toContain("standalone");
    expect(json.icons?.some((icon) => icon.sizes === "192x192")).toBeTruthy();
    expect(json.icons?.some((icon) => icon.purpose === "maskable")).toBeTruthy();
    expect(
      json.icons?.some(
        (icon) =>
          icon.src === "/icons/icon-maskable-512.png" &&
          icon.type === "image/png" &&
          icon.purpose === "maskable",
      ),
    ).toBeTruthy();
    expect(json.screenshots?.some((shot) => shot.form_factor === "wide")).toBeTruthy();
    expect(
      json.screenshots?.some(
        (shot) => shot.form_factor === "wide" && shot.label === "Workflow home desktop",
      ),
    ).toBeTruthy();
    expect(
      json.screenshots?.some(
        (shot) => shot.form_factor === "narrow" && shot.label === "Upload workflow mobile",
      ),
    ).toBeTruthy();
    expect(json.shortcuts?.some((shortcut) => shortcut.url === "/#upload-flow")).toBeTruthy();
    expect(json.shortcuts?.some((shortcut) => shortcut.url === "/demo")).toBeTruthy();
    expect(
      json.shortcuts?.some(
        (shortcut) =>
          shortcut.name === "Analyze screenshot" &&
          shortcut.description === "Upload a UI screenshot and download an export package.",
      ),
    ).toBeTruthy();
    expect(
      json.shortcuts?.some(
        (shortcut) =>
          shortcut.name === "Sample run" &&
          shortcut.description === "Open a guided layout and review a component preview.",
      ),
    ).toBeTruthy();
  }

  const favicon = await request.get("/favicon.ico");
  expect(favicon.ok()).toBeTruthy();
  expect(favicon.headers()["content-type"]).toMatch(/image\/x-icon|image\/vnd\.microsoft\.icon/);

  for (const iconPath of [
    "/icons/icon.svg",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
    "/icons/icon-maskable-512.png",
    "/icons/apple-touch-icon.png",
    "/icons/icon-maskable.svg",
  ]) {
    const response = await request.get(iconPath);
    expect(response.ok()).toBeTruthy();
  }
});

test("social image routes return valid PNG dimensions", async ({ request }) => {
  for (const path of [
    "/opengraph-image",
    "/twitter-image",
    "/design-system/opengraph-image",
    "/design-system/twitter-image",
    "/design-system/laws-of-ux/opengraph-image",
    "/design-system/uilaws/opengraph-image",
  ]) {
    const response = await request.get(path);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toMatch(/image\/png/);
    expect(pngSize(await response.body())).toEqual({ width: 1200, height: 630 });
  }
});
