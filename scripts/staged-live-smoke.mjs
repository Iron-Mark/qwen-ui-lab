#!/usr/bin/env node
/**
 * Staged live rollout smoke — expects liveAnalysisEnabled=true on the target deploy.
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

const args = process.argv.slice(2);
const urlArg = args.find((arg) => arg.startsWith("--url="));
const deployUrl = urlArg ? urlArg.split("=")[1] : process.env.DEPLOY_URL;

if (!deployUrl) {
  console.error(
    "Missing deploy URL. Pass --url=https://your-preview.example or set DEPLOY_URL.",
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
