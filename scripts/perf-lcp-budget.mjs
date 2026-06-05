#!/usr/bin/env node
/**
 * Production LCP budget check (Lighthouse against a deployed URL).
 *
 * Usage:
 *   node scripts/perf-lcp-budget.mjs
 *   node scripts/perf-lcp-budget.mjs --url https://qwen-ui-lab.vercel.app --max-lcp-ms 2500
 *   node scripts/perf-lcp-budget.mjs --strict
 *
 * Env:
 *   PERF_URL / PRODUCTION_DEPLOY_URL — target origin (default: https://qwen-ui-lab.vercel.app)
 *   PERF_PATH — path appended to origin (default: /)
 *   PERF_MAX_LCP_MS — budget in milliseconds (default: 2500)
 *   PERF_LCP_STRICT — "1" or "true" to fail on breach (default: warn-only)
 */

import fs from "node:fs/promises";
import path from "node:path";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const ROOT = process.cwd();
const PERF_DIR = path.join(ROOT, ".perf");

function parseArgs(argv) {
  const options = {
    url:
      process.env.PERF_URL ||
      process.env.PRODUCTION_DEPLOY_URL ||
      "https://qwen-ui-lab.vercel.app",
    path: process.env.PERF_PATH || "/",
    maxLcpMs: Number(process.env.PERF_MAX_LCP_MS || 2500),
    strict:
      process.env.PERF_LCP_STRICT === "1" ||
      process.env.PERF_LCP_STRICT === "true",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === "--url") options.url = argv[i + 1];
    if (current === "--path") options.path = argv[i + 1];
    if (current === "--max-lcp-ms") options.maxLcpMs = Number(argv[i + 1]);
    if (current === "--strict") options.strict = true;
    if (current === "--warn-only") options.strict = false;
  }

  return options;
}

function resolveTargetUrl(origin, routePath) {
  const base = origin.replace(/\/$/, "");
  const suffix = routePath.startsWith("/") ? routePath : `/${routePath}`;
  return `${base}${suffix}`;
}

async function launchChrome() {
  try {
    return await chromeLauncher.launch({
      chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
    });
  } catch (error) {
    if (error?.code !== "ERR_LAUNCHER_NOT_INSTALLED") {
      throw error;
    }

    const playwright = await import("playwright");
    return chromeLauncher.launch({
      chromePath: playwright.chromium.executablePath(),
      chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
    });
  }
}

const options = parseArgs(process.argv.slice(2));
const targetUrl = resolveTargetUrl(options.url, options.path);

let chrome;
try {
  await fs.mkdir(PERF_DIR, { recursive: true });
  chrome = await launchChrome();

  const result = await lighthouse(targetUrl, {
    port: chrome.port,
    output: "json",
    logLevel: "error",
    onlyCategories: ["performance"],
    throttlingMethod: "simulate",
    formFactor: "desktop",
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
  });

  if (!result?.lhr) {
    throw new Error("Lighthouse did not return an LHR payload.");
  }

  const reportPath = path.join(PERF_DIR, "lighthouse-lcp-budget.json");
  await fs.writeFile(reportPath, result.report, "utf8");

  const lcpAudit = result.lhr.audits["largest-contentful-paint"];
  const lcpMs = lcpAudit?.numericValue ?? Number.POSITIVE_INFINITY;
  const lcpDisplay = lcpAudit?.displayValue ?? "n/a";
  const perfScore = Math.round((result.lhr.categories.performance?.score ?? 0) * 100);

  const summary = {
    targetUrl,
    performanceScore: perfScore,
    lcpMs: Number.isFinite(lcpMs) ? Math.round(lcpMs) : null,
    lcpDisplay,
    maxLcpMs: options.maxLcpMs,
    strict: options.strict,
    report: path.relative(ROOT, reportPath),
  };

  console.log("\nLCP_BUDGET_SUMMARY_START");
  console.log(JSON.stringify(summary, null, 2));
  console.log("LCP_BUDGET_SUMMARY_END\n");

  const overBudget = lcpMs > options.maxLcpMs;
  if (overBudget) {
    const message = `LCP budget exceeded: ${lcpDisplay} (${Math.round(lcpMs)}ms) > ${options.maxLcpMs}ms on ${targetUrl}`;
    if (options.strict) {
      console.error(`FAIL: ${message}`);
      process.exit(1);
    }
    console.warn(`WARN: ${message} (warn-only mode; set PERF_LCP_STRICT=1 or --strict to fail)`);
    process.exit(0);
  }

  console.log(
    `PASS: LCP ${lcpDisplay} (${Math.round(lcpMs)}ms) within ${options.maxLcpMs}ms budget on ${targetUrl}`,
  );
} finally {
  if (chrome) {
    await chrome.kill();
  }
}
