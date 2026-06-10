import { defineConfig, devices } from "@playwright/test";

const e2ePort = process.env.E2E_PWA_PORT ?? "3211";
const e2eBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${e2ePort}`;

/**
 * E2E against a production build (`next build` + `next start`).
 * Service worker registration is disabled in `next dev`.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: /pwa-production\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: e2eBaseUrl,
    trace: "on-first-retry",
    serviceWorkers: "allow",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start:prod:e2e",
    url: e2eBaseUrl,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "1",
    timeout: 180_000,
    env: {
      ...process.env,
      PORT: e2ePort,
    },
  },
});
