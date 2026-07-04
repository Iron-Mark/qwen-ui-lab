import { defineConfig, devices } from "@playwright/test";

const e2ePort = process.env.E2E_PORT ?? "3210";
const e2eBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${e2ePort}`;

function e2eDevServerEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) env[key] = value;
  }
  delete env.DASHSCOPE_API_KEY;
  delete env.QWEN_LIVE_ANALYSIS;
  delete env.USE_LIVE_QWEN;
  delete env.QWEN_BASE_URL;
  delete env.QWEN_MODEL;
  return env;
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : process.platform === "win32" ? 1 : 4,
  reporter: "list",
  snapshotPathTemplate:
    "{testDir}/{testFileDir}/{testFileName}-snapshots/{platform}/{arg}{ext}",
  use: {
    baseURL: e2eBaseUrl,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: /mobile\.spec\.ts|pwa-production\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      testMatch: /mobile\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: process.env.CI
      ? `npm run build && npm run start -- -p ${e2ePort}`
      : `npm run dev -- -p ${e2ePort}`,
    url: e2eBaseUrl,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "1",
    timeout: process.env.CI ? 300_000 : 120_000,
    env: e2eDevServerEnv(),
  },
});
