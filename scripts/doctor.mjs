#!/usr/bin/env node
/**
 * npm run doctor — env, deps, and API health checks.
 */
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  canUseLiveQwen,
  getQwenConfig,
  isLiveQwenAnalysisEnabled,
} from "../src/features/analysis/lib/qwen-analyze.mjs";

function loadEnvLocal() {
  const path = ".env.local";
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function check(label, ok, detail) {
  const icon = ok ? "✓" : "✗";
  console.log(`${icon} ${label}${detail ? ` — ${detail}` : ""}`);
  return ok;
}

loadEnvLocal();

console.log("qwen-ui-lab doctor\n");

let allOk = true;

allOk =
  check("node_modules present", existsSync("node_modules")) && allOk;

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
for (const dep of ["next", "react", "recharts", "chart.js", "prismjs"]) {
  allOk =
    check(`dependency: ${dep}`, Boolean(pkg.dependencies?.[dep] || pkg.devDependencies?.[dep])) &&
    allOk;
}

const config = getQwenConfig();
const liveEnabled = isLiveQwenAnalysisEnabled();
if (!config.ok) {
  check("DASHSCOPE_API_KEY", false, "not set — offline demo mode only");
  check("QWEN_LIVE_ANALYSIS", false, "demo mode (no upstream calls)");
} else {
  check("DASHSCOPE_API_KEY", true, "configured");
  if (liveEnabled) {
    check("QWEN_LIVE_ANALYSIS", true, "live vision calls enabled");
  } else {
    check(
      "QWEN_LIVE_ANALYSIS",
      false,
      "not enabled — demo mode only (key alone does not call Qwen)",
    );
  }
  try {
    new URL(config.baseUrl);
    check("QWEN_BASE_URL", true, config.baseUrl);
  } catch {
    allOk = check("QWEN_BASE_URL", false, "invalid URL") && allOk;
  }
  check("QWEN_MODEL", true, config.model);
}

const testRun = spawnSync(process.execPath, ["--test", "tests/analyze-fallback.test.mjs"], {
  stdio: "inherit",
  shell: false,
});
allOk = check("sample tests", testRun.status === 0) && allOk;

if (canUseLiveQwen()) {
  console.log("\nPinging Qwen API (text-only)…");
  const endpoint = `${config.baseUrl.replace(/\/$/, "")}/chat/completions`;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: "Reply OK" }],
        max_tokens: 4,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    allOk =
      check(
        "Qwen API ping",
        response.ok,
        response.ok ? `HTTP ${response.status}` : payload?.error?.message || `HTTP ${response.status}`,
      ) && allOk;
  } catch (error) {
    allOk = check("Qwen API ping", false, error.message) && allOk;
  }
} else if (config.ok) {
  console.log(
    "\nSkipping Qwen API ping (API key present but QWEN_LIVE_ANALYSIS is not enabled).",
  );
} else {
  console.log("\nSkipping Qwen API ping (no API key).");
}

console.log(allOk ? "\nDoctor: all checks passed." : "\nDoctor: some checks failed.");
process.exit(allOk ? 0 : 1);
