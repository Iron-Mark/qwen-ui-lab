#!/usr/bin/env node
/**
 * Production / Preview host env validation (local or CI with env loaded).
 * Does not call Vercel APIs — compare against docs/ops/LIVE_QWEN_ROLLOUT.md matrix.
 *
 * Usage:
 *   npm run validate:prod
 *   node scripts/validate-prod-env.mjs --target=preview
 */

import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { canUseGithubGist } from "../src/features/export/lib/github-gist.mjs";
import { isRateLimitKvConfigured } from "../src/features/analysis/lib/analyze-ui-rate-limit-store.mjs";
import { resolveErrorReportingTargets } from "../src/lib/error-reporting.mjs";
import { createObservabilityConfig } from "../src/lib/observability.mjs";
import { resolvePublicSiteUrl } from "../src/lib/public-site-url.mjs";
import {
  canUseLiveQwen,
  getQwenConfig,
  isLiveQwenAnalysisEnabled,
} from "../src/features/analysis/lib/qwen-analyze.mjs";

function trim(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

/**
 * @param {string} source
 */
export function parseEnvFileContent(source) {
  const values = {};

  for (const rawLine of String(source || "").split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/u.exec(line);
    if (!match) continue;

    const [, key, rawValue] = match;
    values[key] = normalizeEnvFileValue(rawValue);
  }

  return values;
}

/**
 * @param {string} filePath
 * @param {{ cwd?: string }} [options]
 */
export function loadEnvFile(filePath, { cwd = process.cwd() } = {}) {
  const resolvedPath = path.resolve(cwd, filePath);
  const source = fs.readFileSync(resolvedPath, "utf8");
  return {
    resolvedPath,
    values: parseEnvFileContent(source),
  };
}

function normalizeEnvFileValue(rawValue) {
  let value = String(rawValue || "").trim();
  const quote = value[0];

  if ((quote === `"` || quote === `'`) && value.endsWith(quote)) {
    value = value.slice(1, -1);
    if (quote === `"`) {
      value = value.replace(/\\n/gu, "\n").replace(/\\"/gu, `"`);
    }
    return value;
  }

  return value.replace(/\s+#.*$/u, "").trim();
}

function isValidUrl(raw) {
  if (!raw) return false;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function checkUrl(raw, label, failures) {
  if (!raw) return;
  if (!isValidUrl(raw)) {
    failures.push(`${label} must be a valid URL.`);
  }
}

/**
 * @param {Record<string, string | undefined>} env
 * @param {{ target?: "production" | "preview" }} [options]
 */
export function validateProdEnv(env = process.env, options = {}) {
  const target = options.target === "preview" ? "preview" : "production";
  const failures = [];
  const warnings = [];
  const notes = [];

  const kvOk = isRateLimitKvConfigured(env);
  const gistOk = canUseGithubGist(env);
  const observability = createObservabilityConfig(env);
  const reporting = resolveErrorReportingTargets(env);
  const liveRequested = isLiveQwenAnalysisEnabled(env);
  const qwenConfig = getQwenConfig(env);
  const publicSite = resolvePublicSiteUrl(env);

  if (target === "production") {
    if (!publicSite.configured) {
      failures.push(
        "Production requires NEXT_PUBLIC_SITE_URL or VERCEL_PROJECT_PRODUCTION_URL for canonical URLs, sitemap, robots, and share links.",
      );
    } else if (!publicSite.valid) {
      failures.push(`${publicSite.source} must be a valid public URL or host.`);
    } else if (publicSite.local) {
      failures.push(`${publicSite.source} must not point to localhost in production.`);
    } else if (!publicSite.https) {
      failures.push(`${publicSite.source} must use HTTPS in production.`);
    } else if (!publicSite.originOnly) {
      failures.push(`${publicSite.source} must be a public origin without a path, query, or hash.`);
    } else {
      notes.push(`Canonical site URL: ${publicSite.normalized}.`);
    }

    if (!kvOk) {
      failures.push(
        "Production requires KV_REST_API_URL and KV_REST_API_TOKEN (Vercel KV / share links + cluster rate limits).",
      );
    }
    if (!gistOk) {
      failures.push(
        "Production requires GITHUB_GIST_TOKEN or GITHUB_TOKEN (server-only gist export).",
      );
    }
    if (liveRequested) {
      failures.push(
        "Production deploys must stay local-analysis-first: unset QWEN_LIVE_ANALYSIS / USE_LIVE_QWEN unless a staged live rollout is approved.",
      );
    } else {
      notes.push("Live Qwen: local-analysis-first (flag unset/false) — documented production default.");
    }
    if (env.DASHSCOPE_API_KEY?.trim() && !liveRequested) {
      warnings.push(
        "DASHSCOPE_API_KEY is set but live flag is off — safe; no upstream calls until QWEN_LIVE_ANALYSIS=true.",
      );
    }
  } else {
    if (!publicSite.configured) {
      warnings.push(
        "Preview: public site URL unset - sitemap, robots, social metadata, and short share URLs use localhost fallbacks.",
      );
    } else if (!publicSite.valid) {
      failures.push(`${publicSite.source} must be a valid public URL or host.`);
    } else if (publicSite.local) {
      warnings.push(
        `${publicSite.source} points to localhost - fine for local preview, but not for a shared staging URL.`,
      );
    } else if (!publicSite.originOnly) {
      failures.push(`${publicSite.source} must be a public origin without a path, query, or hash.`);
    } else {
      notes.push(`Canonical site URL: ${publicSite.normalized}.`);
    }

    if (!kvOk) {
      warnings.push(
        "Preview: KV_REST_API_* unset - share links and rate limits use in-memory per instance.",
      );
    }
    if (!gistOk) {
      warnings.push("Preview: GITHUB_TOKEN unset — gist export falls back to manual instructions.");
    }
    if (liveRequested) {
      if (!qwenConfig.ok) {
        failures.push("Preview live rehearsal requires DASHSCOPE_API_KEY.");
      }
      if (!trim(env.QWEN_MODEL)) {
        failures.push("Preview live rehearsal requires QWEN_MODEL (e.g. qwen3-vl-plus).");
      }
      if (!canUseLiveQwen(env)) {
        failures.push(
          "Preview live env incomplete — need QWEN_LIVE_ANALYSIS=true, DASHSCOPE_API_KEY, and QWEN_MODEL.",
        );
      }
      notes.push("Live Qwen: enabled on Preview — matches docs/ops/LIVE_QWEN_ROLLOUT.md Stage A.");
    } else {
      notes.push("Live Qwen: disabled on Preview (local-analysis preview build).");
    }
  }

  checkUrl(env.QWEN_BASE_URL, "QWEN_BASE_URL", failures);

  if (trim(env.NEXT_PUBLIC_QWEN_API_KEY)) {
    failures.push("NEXT_PUBLIC_QWEN_API_KEY must never be set (server secret leakage risk).");
  }

  const sentryDsn = reporting.sentryDsn;
  const errorMonitoringOn = observability.errorMonitoringEnabled;

  if (errorMonitoringOn) {
    if (!sentryDsn) {
      failures.push(
        "NEXT_PUBLIC_SENTRY_DSN is required when NEXT_PUBLIC_OBSERVABILITY_ENABLED and NEXT_PUBLIC_ERROR_MONITORING_ENABLED are true.",
      );
    } else if (!isValidUrl(sentryDsn)) {
      failures.push("NEXT_PUBLIC_SENTRY_DSN must be a valid URL.");
    } else {
      notes.push(`Sentry: configured (${reporting.sentryEnvironment}).`);
    }
  } else if (sentryDsn) {
    warnings.push(
      "NEXT_PUBLIC_SENTRY_DSN is set but error monitoring flags are off — Sentry will not initialize.",
    );
    notes.push("Sentry: DSN present but monitoring disabled (local-first default).");
  } else if (target === "production") {
    notes.push(
      "Sentry: unset — local-first default. Enable observability + DSN per docs/ops/OBSERVABILITY.md when ready.",
    );
  } else {
    notes.push("Sentry: optional on Preview — enable with observability flags + DSN.");
  }

  return {
    target,
    ok: failures.length === 0,
    failures,
    warnings,
    notes,
    summary: {
      kvConfigured: kvOk,
      githubGist: gistOk,
      sentryDsn: Boolean(sentryDsn),
      errorMonitoringOn,
      liveAnalysisRequested: liveRequested,
      liveCallsExecutable: canUseLiveQwen(env),
      qwenApiKeyConfigured: qwenConfig.ok,
      publicSiteUrlConfigured: publicSite.configured,
      publicSiteUrl: publicSite.valid ? publicSite.normalized : "",
    },
  };
}

function parseCliArgs(argv) {
  const arg = argv.find((item) => item.startsWith("--target="));
  const value = (arg ? arg.split("=")[1] : "production").toLowerCase();
  if (!["production", "preview"].includes(value)) {
    console.error("Invalid --target. Use --target=production or --target=preview.");
    process.exit(1);
  }
  const envFileArg = argv.find((item) => item.startsWith("--env-file="));
  const envFile = envFileArg ? envFileArg.split("=").slice(1).join("=") : "";

  return { target: value, envFile };
}

function main() {
  const { target, envFile } = parseCliArgs(process.argv.slice(2));
  let env = process.env;

  if (envFile) {
    const loaded = loadEnvFile(envFile);
    env = { ...process.env, ...loaded.values };
    console.log(
      `Loaded env file: ${loaded.resolvedPath} (${Object.keys(loaded.values).length} keys, values hidden).`,
    );
  }

  const result = validateProdEnv(env, { target });

  console.log(`Prod env validation target: ${result.target}`);
  console.log(`- KV configured: ${result.summary.kvConfigured ? "yes" : "no"}`);
  console.log(`- GITHUB_TOKEN: ${result.summary.githubGist ? "yes" : "no"}`);
  console.log(`- Sentry DSN set: ${result.summary.sentryDsn ? "yes" : "no"}`);
  console.log(`- Error monitoring enabled: ${result.summary.errorMonitoringOn ? "yes" : "no"}`);
  console.log(`- Public site URL: ${result.summary.publicSiteUrlConfigured ? "yes" : "no"}`);
  console.log(`- Live analysis requested: ${result.summary.liveAnalysisRequested ? "yes" : "no"}`);
  console.log(
    `- Live calls executable: ${result.summary.liveCallsExecutable ? "yes" : "no"}`,
  );

  for (const note of result.notes) {
    console.log(`NOTE: ${note}`);
  }
  for (const warning of result.warnings) {
    console.warn(`WARNING: ${warning}`);
  }
  if (result.failures.length > 0) {
    for (const failure of result.failures) {
      console.error(`ERROR: ${failure}`);
    }
    process.exit(1);
  }

  console.log("Prod env validation passed.");
  console.log("See docs/ops/LIVE_QWEN_ROLLOUT.md for the Vercel Production vs Preview matrix.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
