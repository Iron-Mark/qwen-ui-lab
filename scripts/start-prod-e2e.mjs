#!/usr/bin/env node
/**
 * Start production server for PWA E2E.
 * Reuses an existing .next output when present to avoid duplicate builds.
 */
import { existsSync, statSync } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";

const port = process.env.PORT ?? "3000";
const nextDir = join(process.cwd(), ".next");
const buildIdPath = join(nextDir, "BUILD_ID");
const buildInputs = [
  "next.config.ts",
  "src/proxy.ts",
  "src/lib/csp.ts",
  "src/lib/csp-report.mjs",
  "src/app/layout.tsx",
  "src/app/api/security/csp-report/route.ts",
].map((path) => join(process.cwd(), path));

function isBuildFresh() {
  if (!existsSync(buildIdPath)) return false;

  const buildTime = statSync(buildIdPath).mtimeMs;
  return buildInputs.every((input) => {
    if (!existsSync(input)) return true;
    return statSync(input).mtimeMs <= buildTime;
  });
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      env: { ...process.env, PORT: port },
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

if (!isBuildFresh()) {
  await run("npm", ["run", "build"]);
}

await run("npx", ["next", "start", "--port", port]);
