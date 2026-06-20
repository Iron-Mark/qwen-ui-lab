#!/usr/bin/env node

import { canUseLiveQwen, getQwenConfig, isLiveQwenAnalysisEnabled } from "../src/features/analysis/lib/qwen-analyze.mjs";

const args = process.argv.slice(2);
const targetArg = args.find((arg) => arg.startsWith("--target="));
const target = (targetArg ? targetArg.split("=")[1] : "demo").toLowerCase();

if (!["demo", "live"].includes(target)) {
  console.error("Invalid --target value. Use --target=demo or --target=live.");
  process.exit(1);
}

const isLiveRequested = isLiveQwenAnalysisEnabled();
const config = getQwenConfig();

const failures = [];
const warnings = [];

function isTruthy(raw) {
  if (raw === undefined || raw === null) return false;
  const value = String(raw).trim().toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}

function checkUrl(raw, label) {
  if (!raw) return;
  try {
    new URL(raw);
  } catch {
    failures.push(`${label} must be a valid URL.`);
  }
}

checkUrl(process.env.QWEN_BASE_URL, "QWEN_BASE_URL");

if (target === "demo") {
  if (isLiveRequested) {
    failures.push(
      "Demo deploy target forbids live upstream calls. Unset QWEN_LIVE_ANALYSIS / USE_LIVE_QWEN.",
    );
  }

  if (process.env.DASHSCOPE_API_KEY) {
    warnings.push(
      "DASHSCOPE_API_KEY is set, but demo target is still safe because QWEN_LIVE_ANALYSIS is disabled.",
    );
  }
}

if (target === "live") {
  if (!isLiveRequested) {
    failures.push("Live deploy target requires QWEN_LIVE_ANALYSIS=true (or USE_LIVE_QWEN=1).");
  }

  if (!config.ok) {
    failures.push("Live deploy target requires DASHSCOPE_API_KEY.");
  }

  if (!process.env.QWEN_MODEL || String(process.env.QWEN_MODEL).trim().length === 0) {
    failures.push("Live deploy target requires QWEN_MODEL.");
  }
}

if (isTruthy(process.env.NEXT_PUBLIC_QWEN_API_KEY)) {
  failures.push("NEXT_PUBLIC_QWEN_API_KEY must never be set (server secret leakage risk).");
}

if (!config.ok && target === "live") {
  failures.push("Live deploy target has no usable Qwen config.");
}

console.log(`Deploy env validation target: ${target}`);
console.log(`- Live analysis requested: ${isLiveRequested ? "yes" : "no"}`);
console.log(`- API key configured: ${config.ok ? "yes" : "no"}`);
console.log(`- Live calls executable: ${canUseLiveQwen() ? "yes" : "no"}`);

for (const warning of warnings) {
  console.warn(`WARNING: ${warning}`);
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`ERROR: ${failure}`);
  }
  process.exit(1);
}

console.log("Deploy env validation passed.");
