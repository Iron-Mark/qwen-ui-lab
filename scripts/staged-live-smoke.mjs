#!/usr/bin/env node
/**
 * Staged live rollout smoke - expects liveAnalysisEnabled=true on the target deploy.
 *
 * Usage:
 *   DEPLOY_URL=https://<preview-or-staging> node scripts/staged-live-smoke.mjs
 *   node scripts/staged-live-smoke.mjs --url=https://<preview-or-staging>
 *
 * Do not point at public production until live env is intentionally enabled on that host.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const smokeScript = join(__dirname, "post-deploy-smoke.mjs");

/** Public production smoke requires explicit live-analysis override. */
const BLOCKED_PRODUCTION_HOSTS = new Set(["qwen-ui-lab.vercel.app"]);

const args = process.argv.slice(2);
const urlArg = args.find((arg) => arg.startsWith("--url="));
const deployUrl = urlArg ? urlArg.split("=")[1] : process.env.DEPLOY_URL;

if (!deployUrl) {
  console.error(
    "Missing deploy URL. Pass --url=https://your-preview.example or set DEPLOY_URL.",
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

if (parsedUrl.protocol !== "https:") {
  console.error(
    "Staged live smoke requires HTTPS. Use a Vercel preview URL (https://...).",
  );
  process.exit(1);
}

const hostname = parsedUrl.hostname.toLowerCase();
if (
  BLOCKED_PRODUCTION_HOSTS.has(hostname) &&
  process.env.ALLOW_PRODUCTION_LIVE_SMOKE !== "1"
) {
  console.error(
    `Refusing staged live smoke on public local-analysis host (${hostname}). ` +
      "Enable live on a Preview deployment first, or set ALLOW_PRODUCTION_LIVE_SMOKE=1 when production is intentionally live.",
  );
  process.exit(1);
}

const child = spawnSync(process.execPath, [smokeScript, ...args], {
  stdio: "inherit",
  env: {
    ...process.env,
    DEPLOY_URL: deployUrl,
    EXPECT_LIVE_ANALYSIS: "true",
  },
});

process.exit(child.status ?? 1);
