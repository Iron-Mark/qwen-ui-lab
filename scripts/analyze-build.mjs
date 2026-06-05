#!/usr/bin/env node

import { spawnSync } from "node:child_process";

process.env.ANALYZE = "true";
process.env.NEXT_TELEMETRY_DISABLED = "1";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(npmCmd, ["run", "build"], {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
