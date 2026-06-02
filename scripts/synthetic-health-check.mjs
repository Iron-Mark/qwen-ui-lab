#!/usr/bin/env node
/**
 * Synthetic health probe for qwen-ui-lab.
 *
 * Usage:
 *   node scripts/synthetic-health-check.mjs
 *   node scripts/synthetic-health-check.mjs --base-url https://qwen-ui-lab.vercel.app --attempts 5 --expect-live false
 */

function parseArgs(argv) {
  const options = {
    baseUrl: process.env.SYNTHETIC_BASE_URL || "http://localhost:3000",
    attempts: Number(process.env.SYNTHETIC_ATTEMPTS || 3),
    maxLatencyMs: Number(process.env.SYNTHETIC_MAX_LATENCY_MS || 2000),
    warnLatencyMs: Number(process.env.SYNTHETIC_WARN_LATENCY_MS || 1000),
    expectLive: process.env.SYNTHETIC_EXPECT_LIVE,
    timeoutMs: Number(process.env.SYNTHETIC_TIMEOUT_MS || 5000),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === "--base-url") options.baseUrl = argv[i + 1];
    if (current === "--attempts") options.attempts = Number(argv[i + 1]);
    if (current === "--max-latency-ms") options.maxLatencyMs = Number(argv[i + 1]);
    if (current === "--warn-latency-ms") options.warnLatencyMs = Number(argv[i + 1]);
    if (current === "--timeout-ms") options.timeoutMs = Number(argv[i + 1]);
    if (current === "--expect-live") options.expectLive = argv[i + 1];
  }

  return options;
}

function parseExpectedLive(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y"].includes(normalized)) return true;
  if (["0", "false", "no", "n"].includes(normalized)) return false;
  throw new Error(`Invalid --expect-live value: ${value}`);
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

async function runAttempt(url, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const latencyMs = Date.now() - started;
    const body = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, latencyMs, body };
  } catch (error) {
    const latencyMs = Date.now() - started;
    return { ok: false, status: 0, latencyMs, error: error.message };
  } finally {
    clearTimeout(timeoutId);
  }
}

function printResultLine(index, result) {
  const prefix = `[attempt ${index}]`;
  if (!result.ok) {
    const detail = result.error
      ? `error=${result.error}`
      : `status=${result.status}`;
    console.log(`${prefix} FAIL ${detail} latency=${result.latencyMs}ms`);
    return;
  }
  const mode = result.body?.provider ?? "unknown";
  const live = result.body?.liveAnalysisEnabled;
  console.log(
    `${prefix} PASS status=${result.status} latency=${result.latencyMs}ms provider=${mode} liveAnalysisEnabled=${live}`,
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const expectLive = parseExpectedLive(args.expectLive);

  if (!Number.isInteger(args.attempts) || args.attempts <= 0) {
    throw new Error(`--attempts must be a positive integer (received: ${args.attempts})`);
  }
  if (!args.baseUrl) throw new Error("--base-url is required");

  const healthUrl = `${args.baseUrl.replace(/\/$/, "")}/api/health`;
  console.log(`Synthetic check target: ${healthUrl}`);

  const failures = [];
  const latencies = [];
  let liveMismatchCount = 0;

  for (let i = 1; i <= args.attempts; i += 1) {
    const result = await runAttempt(healthUrl, args.timeoutMs);
    printResultLine(i, result);

    if (!result.ok || result.body?.ok !== true) {
      failures.push(result);
      continue;
    }

    latencies.push(result.latencyMs);

    if (expectLive !== undefined && result.body?.liveAnalysisEnabled !== expectLive) {
      liveMismatchCount += 1;
    }
  }

  const p95 = percentile(latencies, 95);
  const avg = latencies.length
    ? Math.round(latencies.reduce((sum, item) => sum + item, 0) / latencies.length)
    : 0;
  const successRate = Math.round(((args.attempts - failures.length) / args.attempts) * 100);

  console.log("\nSummary:");
  console.log(`- attempts: ${args.attempts}`);
  console.log(`- success_rate: ${successRate}%`);
  console.log(`- avg_latency_ms: ${avg}`);
  console.log(`- p95_latency_ms: ${p95}`);
  if (expectLive !== undefined) {
    console.log(`- expected_liveAnalysisEnabled: ${expectLive}`);
    console.log(`- live_mode_mismatches: ${liveMismatchCount}`);
  }

  if (failures.length > 0) {
    console.error("\nCRITICAL: One or more health probes failed.");
    process.exit(1);
  }
  if (expectLive !== undefined && liveMismatchCount > 0) {
    console.error("\nCRITICAL: liveAnalysisEnabled did not match expected value.");
    process.exit(1);
  }
  if (p95 > args.maxLatencyMs) {
    console.error(
      `\nCRITICAL: p95 latency ${p95}ms exceeded max threshold ${args.maxLatencyMs}ms.`,
    );
    process.exit(1);
  }
  if (p95 > args.warnLatencyMs) {
    console.warn(
      `\nWARNING: p95 latency ${p95}ms exceeded warning threshold ${args.warnLatencyMs}ms.`,
    );
  }

  console.log("\nPASS: Synthetic health check completed within thresholds.");
}

main().catch((error) => {
  console.error(`Synthetic check failed: ${error.message}`);
  process.exit(1);
});
