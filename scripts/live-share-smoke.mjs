#!/usr/bin/env node
/**
 * Browser smoke for production share/export behavior.
 *
 * Usage:
 *   DEPLOY_URL=https://qwen-ui-lab.vercel.app npm run smoke:share-live
 *   node scripts/live-share-smoke.mjs --url=https://qwen-ui-lab.vercel.app
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const urlArg = args.find((arg) => arg.startsWith("--url="));
const deployUrl = urlArg ? urlArg.split("=")[1] : process.env.DEPLOY_URL;

if (!deployUrl) {
  console.error(
    "Missing deploy URL. Pass --url=https://your-app.example or set DEPLOY_URL.",
  );
  process.exit(1);
}

let parsedUrl;
try {
  parsedUrl = new URL(deployUrl);
} catch {
  console.error(`Invalid deploy URL: ${deployUrl}`);
  process.exit(1);
}

if (parsedUrl.protocol !== "https:" && parsedUrl.hostname !== "localhost") {
  console.error("Share smoke expects an HTTPS deploy URL or localhost.");
  process.exit(1);
}

const playwrightCli = join(process.cwd(), "node_modules", "playwright", "cli.js");
if (!existsSync(playwrightCli)) {
  console.error("Missing Playwright CLI. Run npm install before share smoke.");
  process.exit(1);
}

const smokeEnv = {
  ...process.env,
  PLAYWRIGHT_BASE_URL: parsedUrl.toString().replace(/\/$/, ""),
  PLAYWRIGHT_REUSE_SERVER: "1",
};

const checks = [
  {
    label: "portable hash share route",
    args: [
      "test",
      "e2e/share-route.spec.ts",
      "--project=chromium",
      "--grep",
      "/share/local",
    ],
  },
  {
    label: "upload/export/copy share flow",
    args: [
      "test",
      "e2e/upload-flow.spec.ts:261",
      "--project=chromium",
    ],
  },
];

console.log(`Running share/export browser smoke against ${smokeEnv.PLAYWRIGHT_BASE_URL}`);

for (const check of checks) {
  console.log(`\n> ${check.label}`);
  const result = spawnSync(process.execPath, [playwrightCli, ...check.args], {
    stdio: "inherit",
    env: smokeEnv,
  });

  if (result.error) {
    console.error(`\nFAIL ${check.label}: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`\nFAIL ${check.label}`);
    process.exit(result.status ?? 1);
  }
}

console.log("\nPASS: Share/export browser smoke completed.");
