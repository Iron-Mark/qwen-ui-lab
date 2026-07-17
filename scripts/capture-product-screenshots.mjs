#!/usr/bin/env node
import { chromium } from "@playwright/test";
import { copyFile, mkdir, readFile, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_BASE_URL = "http://localhost:3001";
const ROOT = process.cwd();
const SCREENSHOT_ROOT = join(ROOT, "public", "screenshots");
const MOCKUP_ROOT = join(ROOT, "public", "mock-ups");
const DOC_ASSET_ROOT = join(ROOT, "docs", "assets");

const VIEWPORTS = {
  desktop: { width: 1440, height: 1000 },
  tablet: { width: 840, height: 1000 },
  mobile: { width: 390, height: 844 },
};

const SHARE_FIXTURE = {
  v: 1,
  summary:
    "Admin dashboard shell with stat grid, revenue chart, and activity feed.",
  stats: [
    { l: "Sections", v: "6" },
    { l: "Components", v: "11" },
    { l: "Breakpoints", v: "3" },
    { l: "Review Items", v: "4" },
  ],
  mode: "Ready for review",
  file: "dashboard-reference.png",
  detections: {
    source: { width: 1440, height: 900 },
    designTokens: {
      surface: "#101030",
      foreground: "#ffffff",
      accent: "#7c3aed",
      accentForeground: "#ffffff",
      muted: "#101050",
      border: "#45455e",
    },
    quality: {
      confidence: 0.9,
      ambiguity: "low",
      strategy: "fine-grid-connected-components",
      elementCount: 6,
    },
    elements: [
      {
        id: "element-1",
        kind: "header",
        primitive: "header",
        confidence: 0.94,
        included: true,
        userEdited: false,
        box: { x: 0, y: 0, width: 1440, height: 96 },
      },
      {
        id: "element-2",
        kind: "stat-row",
        primitive: "card-grid",
        confidence: 0.91,
        included: true,
        userEdited: false,
        box: { x: 60, y: 160, width: 900, height: 140 },
      },
      {
        id: "element-3",
        kind: "chart",
        primitive: "chart-card",
        confidence: 0.82,
        included: true,
        userEdited: false,
        box: { x: 60, y: 330, width: 680, height: 320 },
      },
      {
        id: "element-4",
        kind: "activity-list",
        primitive: "list",
        confidence: 0.86,
        included: true,
        userEdited: true,
        box: { x: 780, y: 330, width: 520, height: 320 },
      },
    ],
  },
};

const CAPTURES = [
  {
    group: "A1-Workflow-Home",
    title: "Workflow Home",
    description:
      "The first-run product surface with the primary screenshot-to-React workflow.",
    route: "/",
    variants: [
      ["desktop-light", "desktop", "light"],
      ["desktop-dark", "desktop", "dark"],
      ["tablet-light", "tablet", "light"],
      ["mobile-dark", "mobile", "dark"],
    ],
    waitFor: "[data-testid='home-marketing-hero']",
  },
  {
    group: "A2-Upload-Flow",
    title: "Upload Flow",
    description:
      "Empty and sample-assisted upload states for selecting a screenshot.",
    route: "/#upload-flow",
    variants: [
      ["desktop-light", "desktop", "light"],
      ["tablet-dark", "tablet", "dark"],
      ["mobile-light", "mobile", "light"],
    ],
    waitFor: "[data-testid='upload-dropzone-button']",
    prepare: async (page) => {
      await page.locator("#upload-flow").scrollIntoViewIfNeeded();
    },
  },
  {
    group: "A3-Post-Analysis",
    title: "Post Analysis",
    description:
      "The guided layout after analysis, with preview-ready status and package panel.",
    route: "/demo",
    variants: [
      ["desktop-light", "desktop", "light"],
      ["desktop-dark", "desktop", "dark"],
      ["mobile-dark", "mobile", "dark"],
    ],
    waitFor: "[data-testid='scaffold-export-panel']",
    prepare: async (page) => {
      await page.locator("#upload-flow").scrollIntoViewIfNeeded();
    },
  },
  {
    group: "A4-Detector-Editor",
    title: "Detector Editor",
    description:
      "Editable detection boxes with labels, confidence reasons, and regeneration controls.",
    route: "/demo",
    variants: [
      ["desktop-light", "desktop", "light"],
      ["mobile-light", "mobile", "light"],
    ],
    waitFor: "[data-testid='detector-quality-dashboard']",
    prepare: async (page) => {
      await page.getByTestId("detector-quality-dashboard").scrollIntoViewIfNeeded();
      const labels = page.getByTestId("toggle-box-labels");
      if ((await labels.count()) > 0 && (await labels.isEnabled())) {
        await labels.click();
      }
    },
  },
  {
    group: "A5-Export-Package",
    title: "Export Package",
    description:
      "The review package dialog with file previews, change summary, and download actions.",
    route: "/demo",
    variants: [
      ["desktop-light", "desktop", "light"],
      ["mobile-dark", "mobile", "dark"],
    ],
    waitFor: "[data-testid='export-package-review']",
    prepare: async (page) => {
      await page.getByTestId("export-package-review").click();
      await page.getByRole("dialog", { name: /review package/i }).waitFor({
        state: "visible",
        timeout: 30_000,
      });
    },
  },
  {
    group: "A6-Sample-Run",
    title: "Sample Run",
    description:
      "The compatibility sample-run route with guided dashboard analysis.",
    route: "/demo",
    variants: [
      ["desktop-dark", "desktop", "dark"],
      ["mobile-light", "mobile", "light"],
    ],
    waitFor: "[data-testid='scaffold-export-panel']",
  },
  {
    group: "A7-Design-System",
    title: "Design System",
    description:
      "Component catalog and preview canvas for product and UX-law primitives.",
    route: "/design-system?selected=shadcn-button",
    variants: [
      ["desktop-light", "desktop", "light"],
      ["desktop-dark", "desktop", "dark"],
      ["tablet-light", "tablet", "light"],
      ["mobile-dark", "mobile", "dark"],
    ],
    waitFor: "#component-preview-panel",
  },
  {
    group: "A8-UX-Laws",
    title: "UX Laws",
    description:
      "The Laws of UX collection as rendered inside the design-system browser.",
    route:
      "/design-system?domain=laws-of-ux&selected=law-of-ux-aesthetic-usability",
    variants: [
      ["desktop-light", "desktop", "light"],
      ["mobile-dark", "mobile", "dark"],
    ],
    waitFor: "#component-preview-panel",
  },
  {
    group: "A9-Profile-Modal",
    title: "Profile Modal",
    description:
      "The browser-local profile dialog opened from URL state.",
    route: "/?account=1",
    variants: [
      ["desktop-dark", "desktop", "dark"],
      ["mobile-light", "mobile", "light"],
    ],
    waitFor: "[data-testid='account-modal']",
  },
  {
    group: "A10-Share-Result",
    title: "Share Result",
    description:
      "A read-only shared analysis summary with detection preview.",
    route: `/share/local#${encodeShareHash(SHARE_FIXTURE)}`,
    variants: [
      ["desktop-light", "desktop", "light"],
      ["mobile-dark", "mobile", "dark"],
    ],
    waitFor: "[data-testid='shared-result-summary']",
  },
  {
    group: "A11-404-And-Recovery",
    title: "404 And Recovery",
    description:
      "General not-found and unavailable-share recovery surfaces.",
    variants: [
      ["desktop-light", "desktop", "light", "/not-a-real-qwen-ui-lab-page"],
      ["mobile-dark", "mobile", "dark", "/share/ZZZZZZZZ"],
    ],
    waitFor: "main",
  },
  {
    group: "A12-PWA-Offline",
    title: "PWA Offline",
    description:
      "The static offline fallback used by the service worker.",
    route: "/offline.html",
    variants: [
      ["desktop-light", "desktop", "light"],
      ["mobile-dark", "mobile", "dark"],
    ],
    waitFor: "body",
  },
];

function parseArgs(argv = process.argv.slice(2)) {
  const args = { baseUrl: DEFAULT_BASE_URL };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base-url") {
      args.baseUrl = argv[index + 1] ?? DEFAULT_BASE_URL;
      index += 1;
      continue;
    }
    if (arg.startsWith("--base-url=")) {
      args.baseUrl = arg.slice("--base-url=".length);
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function encodeShareHash(payload) {
  return `share=${Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")}`;
}

function screenshotPath(group, fileName) {
  return join(SCREENSHOT_ROOT, group, `${fileName}.png`);
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "");
}

async function ensureServer(baseUrl) {
  try {
    const response = await fetch(baseUrl, { method: "GET" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    throw new Error(
      `Cannot reach ${baseUrl}. Start the app first, then rerun capture:screenshots. ${error.message}`,
    );
  }
}

async function prepareOutputDirs() {
  await rm(SCREENSHOT_ROOT, { recursive: true, force: true });
  await rm(MOCKUP_ROOT, { recursive: true, force: true });
  await mkdir(SCREENSHOT_ROOT, { recursive: true });
  await mkdir(MOCKUP_ROOT, { recursive: true });
  await mkdir(DOC_ASSET_ROOT, { recursive: true });
}

async function createPage(browser, { viewportName, theme }) {
  const viewport = VIEWPORTS[viewportName];
  const context = await browser.newContext({
    viewport,
    colorScheme: theme,
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  await context.addInitScript(
    ({ selectedTheme }) => {
      window.localStorage.setItem("theme", selectedTheme);
      window.localStorage.setItem("brand-theme", "purple");
      window.sessionStorage.clear();
      document.cookie = `qwen-ui-theme=${selectedTheme}; Path=/; SameSite=Lax`;
      document.cookie = "qwen-ui-brand=purple; Path=/; SameSite=Lax";
    },
    { selectedTheme: theme },
  );
  const page = await context.newPage();
  return { context, page };
}

async function waitForSettledPage(page, selector) {
  await page.locator(selector).waitFor({ state: "visible", timeout: 45_000 });
  await page.waitForLoadState("domcontentloaded", { timeout: 30_000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0.001ms !important;
        animation-delay: 0ms !important;
        transition-duration: 0.001ms !important;
        transition-delay: 0ms !important;
        caret-color: transparent !important;
      }
      nextjs-portal,
      [data-nextjs-dev-tools-button],
      [data-nextjs-toast],
      [data-nextjs-dialog-overlay],
      [data-sonner-toaster],
      [data-sonner-toast] {
        display: none !important;
      }
    `,
  });
  await page.waitForTimeout(350);
}

async function captureVariant(browser, baseUrl, capture, variant) {
  const [name, viewportName, theme, routeOverride] = variant;
  const route = routeOverride ?? capture.route;
  const { context, page } = await createPage(browser, { viewportName, theme });
  const output = screenshotPath(capture.group, name);
  await mkdir(dirname(output), { recursive: true });

  await page.goto(new URL(route, baseUrl).toString(), {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });
  await waitForSettledPage(page, capture.waitFor);
  if (capture.prepare) {
    await capture.prepare(page);
    await page.waitForTimeout(350);
  }
  await page.screenshot({
    path: output,
    fullPage: false,
    animations: "disabled",
  });
  await context.close();
  console.log(`captured ${output.replace(ROOT, "").replace(/^[/\\]/, "")}`);
}

function fileUrl(filePath) {
  return `data:image/png;base64,${filePath.toString("base64")}`;
}

async function imageDataUrl(relativePath) {
  return fileUrl(await readFile(join(ROOT, relativePath)));
}

async function createBoard(browser, { output, title, subtitle, images, layout = "gallery" }) {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 1,
  });
  const imageItems = await Promise.all(
    images.map(async (item) => ({
      ...item,
      src: await imageDataUrl(item.path),
    })),
  );

  const isMatrix = layout === "matrix";
  const html = `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            width: 1600px;
            height: 1000px;
            overflow: hidden;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            color: #f8f7ff;
            background:
              radial-gradient(circle at 15% 10%, rgba(124,58,237,.34), transparent 34%),
              radial-gradient(circle at 86% 18%, rgba(37,99,235,.22), transparent 30%),
              linear-gradient(135deg, #08061f 0%, #111027 45%, #050509 100%);
          }
          main {
            display: grid;
            gap: 28px;
            height: 100%;
            padding: 56px;
          }
          header {
            display: flex;
            align-items: end;
            justify-content: space-between;
            gap: 32px;
          }
          h1 {
            margin: 0;
            font-size: 56px;
            letter-spacing: -0.03em;
            line-height: 0.98;
          }
          p {
            margin: 12px 0 0;
            max-width: 760px;
            color: rgba(248,247,255,.72);
            font-size: 20px;
            line-height: 1.45;
          }
          .badge {
            border: 1px solid rgba(167,139,250,.32);
            border-radius: 999px;
            background: rgba(124,58,237,.18);
            color: #ddd6fe;
            padding: 10px 16px;
            font-size: 15px;
            font-weight: 700;
            white-space: nowrap;
          }
          .grid {
            display: grid;
            grid-template-columns: ${isMatrix ? "repeat(3, 1fr)" : "1.35fr .9fr .9fr"};
            grid-auto-rows: minmax(0, 1fr);
            gap: 18px;
            min-height: 0;
          }
          figure {
            position: relative;
            min-height: 0;
            overflow: hidden;
            margin: 0;
            border: 1px solid rgba(255,255,255,.13);
            border-radius: 24px;
            background: rgba(255,255,255,.06);
            box-shadow: 0 24px 80px rgba(0,0,0,.36);
          }
          figure.featured {
            grid-row: span 2;
          }
          img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: contain;
            object-position: top center;
            padding: 10px;
            opacity: .98;
          }
          figure.featured img {
            object-fit: cover;
            object-position: top left;
            padding: 0;
          }
          figcaption {
            position: absolute;
            left: 14px;
            bottom: 14px;
            max-width: calc(100% - 28px);
            border: 1px solid rgba(255,255,255,.16);
            border-radius: 999px;
            background: rgba(8,6,31,.78);
            padding: 8px 12px;
            font-size: 13px;
            font-weight: 800;
            backdrop-filter: blur(12px);
          }
        </style>
      </head>
      <body>
        <main>
          <header>
            <div>
              <h1>${escapeHtml(title)}</h1>
              <p>${escapeHtml(subtitle)}</p>
            </div>
            <div class="badge">real app captures</div>
          </header>
          <section class="grid">
            ${imageItems
              .map(
                (item, index) => `
                  <figure class="${item.featured || (!isMatrix && index === 0) ? "featured" : ""}">
                    <img src="${item.src}" alt="" />
                    <figcaption>${escapeHtml(item.label)}</figcaption>
                  </figure>
                `,
              )
              .join("")}
          </section>
        </main>
      </body>
    </html>`;

  await page.setContent(html, { waitUntil: "load" });
  await mkdir(dirname(output), { recursive: true });
  await page.screenshot({ path: output, fullPage: false, animations: "disabled" });
  await page.close();
  console.log(`composed ${output.replace(ROOT, "").replace(/^[/\\]/, "")}`);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function createMockups(browser) {
  await createBoard(browser, {
    output: join(MOCKUP_ROOT, "A1-device-showcase.png"),
    title: "qwen-ui-lab across devices",
    subtitle:
      "Homepage, guided analysis, and profile states captured from the real product UI.",
    images: [
      {
        path: "public/screenshots/A1-Workflow-Home/desktop-light.png",
        label: "Desktop workflow",
        featured: true,
      },
      {
        path: "public/screenshots/A3-Post-Analysis/mobile-dark.png",
        label: "Mobile analysis",
      },
      {
        path: "public/screenshots/A9-Profile-Modal/mobile-light.png",
        label: "Profile modal",
      },
      {
        path: "public/screenshots/A7-Design-System/tablet-light.png",
        label: "Tablet catalog",
      },
    ],
  });

  await createBoard(browser, {
    output: join(MOCKUP_ROOT, "A2-feature-gallery.png"),
    title: "Screenshot to React archive",
    subtitle:
      "Upload, inspect, edit, preview, share, and export flows documented as real screenshots.",
    images: [
      {
        path: "public/screenshots/A3-Post-Analysis/desktop-light.png",
        label: "Preview ready",
        featured: true,
      },
      {
        path: "public/screenshots/A4-Detector-Editor/desktop-light.png",
        label: "Editable detections",
      },
      {
        path: "public/screenshots/A5-Export-Package/desktop-light.png",
        label: "Export package",
      },
      {
        path: "public/screenshots/A10-Share-Result/desktop-light.png",
        label: "Shared result",
      },
    ],
  });

  await createBoard(browser, {
    output: join(MOCKUP_ROOT, "A3-theme-viewport-matrix.png"),
    title: "Theme and viewport matrix",
    subtitle:
      "Purple brand theme coverage across light, dark, desktop, tablet, and mobile states.",
    layout: "matrix",
    images: [
      {
        path: "public/screenshots/A1-Workflow-Home/desktop-light.png",
        label: "Home light",
      },
      {
        path: "public/screenshots/A1-Workflow-Home/desktop-dark.png",
        label: "Home dark",
      },
      {
        path: "public/screenshots/A7-Design-System/tablet-light.png",
        label: "Tablet catalog",
      },
      {
        path: "public/screenshots/A2-Upload-Flow/mobile-light.png",
        label: "Mobile upload",
      },
      {
        path: "public/screenshots/A5-Export-Package/mobile-dark.png",
        label: "Mobile export",
      },
      {
        path: "public/screenshots/A12-PWA-Offline/mobile-dark.png",
        label: "Offline dark",
      },
    ],
  });

  await copyFile(
    screenshotPath("A3-Post-Analysis", "desktop-light"),
    join(DOC_ASSET_ROOT, "qwen-ui-lab-workflow-desktop.png"),
  );
  await copyFile(
    screenshotPath("A7-Design-System", "mobile-dark"),
    join(DOC_ASSET_ROOT, "qwen-ui-lab-design-system-mobile.png"),
  );
  await copyFile(
    join(MOCKUP_ROOT, "A2-feature-gallery.png"),
    join(DOC_ASSET_ROOT, "qwen-ui-lab-archive-cover.png"),
  );
}

export { CAPTURES, VIEWPORTS };

async function main() {
  const { baseUrl } = parseArgs();
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  await ensureServer(normalizedBaseUrl);
  await prepareOutputDirs();

  const browser = await chromium.launch();
  try {
    for (const capture of CAPTURES) {
      for (const variant of capture.variants) {
        await captureVariant(browser, normalizedBaseUrl, capture, variant);
      }
    }
    await createMockups(browser);
  } finally {
    await browser.close();
  }

  console.log("Product screenshot capture complete.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
