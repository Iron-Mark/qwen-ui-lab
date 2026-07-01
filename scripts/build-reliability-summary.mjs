#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const DEFAULT_HEALTH_LOG = "synthetic-health.log";
const DEFAULT_SHARE_LOG = "share-export-smoke.log";
const DEFAULT_OUTPUT = "reliability-summary.md";

function parseArgs(argv) {
  const options = {
    healthLogPath: DEFAULT_HEALTH_LOG,
    shareLogPath: DEFAULT_SHARE_LOG,
    outputPath: DEFAULT_OUTPUT,
    target: "",
    expectedLive: "",
    healthOutcome: "",
    shareOutcome: "",
    runUrl: "",
    commit: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1] ?? "";
    if (current === "--health-log") options.healthLogPath = next;
    if (current === "--share-log") options.shareLogPath = next;
    if (current === "--output") options.outputPath = next;
    if (current === "--target") options.target = next;
    if (current === "--expected-live") options.expectedLive = next;
    if (current === "--health-outcome") options.healthOutcome = next;
    if (current === "--share-outcome") options.shareOutcome = next;
    if (current === "--run-url") options.runUrl = next;
    if (current === "--commit") options.commit = next;
  }

  return options;
}

async function readOptionalText(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return "";
  }
}

export function sanitizeSummaryText(value) {
  return String(value ?? "")
    .replace(/#share=[A-Za-z0-9._~+/=-]+/g, "#share=<redacted>")
    .replace(/[A-Z]:\\(?:[^\\\s]+\\)+[^\\\s]*/g, "<local-path>")
    .replace(/\/home\/[^/\s]+\/[^\s#]*/g, "<local-path>")
    .trim();
}

export function parseSyntheticSummary(log) {
  const summary = {};
  let inSummary = false;

  for (const line of String(log ?? "").split(/\r?\n/)) {
    if (line.trim() === "Summary:") {
      inSummary = true;
      continue;
    }

    if (inSummary) {
      const match = line.match(/^\s*-\s+([A-Za-z0-9_]+):\s*(.+?)\s*$/);
      if (match) {
        summary[match[1]] = sanitizeSummaryText(match[2]);
        continue;
      }
      if (line.trim() === "") continue;
      inSummary = false;
    }
  }

  const status = /\bPASS: Synthetic health check completed/.test(log)
    ? "pass"
    : /\bCRITICAL:|\bSynthetic check failed:|\[attempt \d+\] FAIL/.test(log)
      ? "fail"
      : log
        ? "unknown"
        : "missing";

  return { status, summary };
}

export function parseShareSmokeSummary(log) {
  const text = String(log ?? "");
  const sections = [...text.matchAll(/^>\s+(.+)$/gm)].map((match) =>
    sanitizeSummaryText(match[1]),
  );
  const passedCounts = [...text.matchAll(/(\d+)\s+passed\b/g)].map((match) =>
    Number(match[1]),
  );
  const passedCount = passedCounts.reduce((sum, value) => sum + value, 0);
  const status = /\bPASS: Share\/export browser smoke completed\./.test(text)
    ? "pass"
    : /\bFAIL\b|\bfailed\b/i.test(text)
      ? "fail"
      : text
        ? "unknown"
        : "missing";

  return {
    status,
    sections,
    passedCount,
  };
}

function formatOutcome(value, fallback) {
  const normalized = sanitizeSummaryText(value || fallback);
  if (!normalized) return "unknown";
  return normalized;
}

function formatHealthDetail(parsedHealth) {
  const { summary } = parsedHealth;
  const pieces = [
    summary.success_rate ? `success ${summary.success_rate}` : "",
    summary.p95_latency_ms ? `p95 ${summary.p95_latency_ms}ms` : "",
    summary.avg_latency_ms ? `avg ${summary.avg_latency_ms}ms` : "",
    summary.live_mode_mismatches ? `live mismatches ${summary.live_mode_mismatches}` : "",
  ].filter(Boolean);

  return pieces.length > 0 ? pieces.join(", ") : "No summary block found";
}

function formatShareDetail(parsedShare) {
  const parts = [];
  if (parsedShare.passedCount > 0) parts.push(`${parsedShare.passedCount} checks passed`);
  if (parsedShare.sections.length > 0) parts.push(parsedShare.sections.join("; "));
  return parts.length > 0 ? parts.join(" - ") : "No browser-smoke summary found";
}

export function buildReliabilitySummary({
  healthLog = "",
  shareLog = "",
  target = "",
  expectedLive = "",
  healthOutcome = "",
  shareOutcome = "",
  runUrl = "",
  commit = "",
} = {}) {
  const health = parseSyntheticSummary(healthLog);
  const share = parseShareSmokeSummary(shareLog);
  const safeTarget = sanitizeSummaryText(target) || "not provided";
  const safeRunUrl = sanitizeSummaryText(runUrl) || "GitHub Actions run";
  const safeCommit = sanitizeSummaryText(commit) || "not provided";
  const safeExpectedLive = sanitizeSummaryText(expectedLive) || "not provided";

  return [
    "## Production reliability monitor failed",
    "",
    "| Check | Result | Triage summary |",
    "| --- | --- | --- |",
    `| Synthetic health | ${formatOutcome(healthOutcome, health.status)} | ${formatHealthDetail(health)} |`,
    `| Share/export smoke | ${formatOutcome(shareOutcome, share.status)} | ${formatShareDetail(share)} |`,
    "",
    "### Monitor context",
    "",
    `- Target: ${safeTarget}`,
    `- Expected live analysis: ${safeExpectedLive}`,
    `- Run: ${safeRunUrl}`,
    `- Commit: ${safeCommit}`,
    "",
    "Raw health and browser-smoke logs are attached to the workflow artifact for deeper triage.",
    "No secrets, API keys, share payloads, or local file paths are included in this issue body.",
    "",
  ].join("\n");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const [healthLog, shareLog] = await Promise.all([
    readOptionalText(options.healthLogPath),
    readOptionalText(options.shareLogPath),
  ]);
  const summary = buildReliabilitySummary({
    healthLog,
    shareLog,
    target: options.target,
    expectedLive: options.expectedLive,
    healthOutcome: options.healthOutcome,
    shareOutcome: options.shareOutcome,
    runUrl: options.runUrl,
    commit: options.commit,
  });

  await writeFile(options.outputPath, summary, "utf8");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Reliability summary failed: ${error.message}`);
    process.exit(1);
  });
}
