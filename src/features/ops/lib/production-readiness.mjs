import { buildAnalyzeHealthResponse } from "../../analysis/lib/qwen-analyze.mjs";
import { canUseGithubGist } from "../../export/lib/github-gist.mjs";
import { canUseGithubRepoExport } from "../../export/lib/github-repo.mjs";
import {
  getShareStoreConfig,
  isShareKvConfigured,
} from "../../share/lib/share-store.mjs";

function present(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function statusRank(status) {
  if (status === "ready") return 3;
  if (status === "optional") return 2;
  if (status === "fallback") return 1;
  return 0;
}

function createCheck({ id, label, status, active, detail }) {
  return {
    id,
    label,
    status,
    active: Boolean(active),
    detail,
  };
}

export function buildProductionReadiness(env = process.env) {
  const health = buildAnalyzeHealthResponse(env);
  const shareConfig = getShareStoreConfig(env);
  const kvConfigured = isShareKvConfigured(env);
  const gistConfigured = canUseGithubGist(env);
  const repoExportConfigured = canUseGithubRepoExport(env);
  const publicSiteConfigured =
    present(env.NEXT_PUBLIC_SITE_URL) || present(env.VERCEL_PROJECT_PRODUCTION_URL);

  const checks = [
    createCheck({
      id: "demo-fallback",
      label: "Offline demo fallback",
      status: "ready",
      active: health.provider === "demo",
      detail:
        "Upload, deterministic detection, preview generation, local sessions, and file exports run without upstream credentials.",
    }),
    createCheck({
      id: "live-qwen",
      label: "Live Qwen analysis",
      status: health.liveAnalysisEnabled
        ? "ready"
        : health.hasApiKey
          ? "optional"
          : "fallback",
      active: health.liveAnalysisEnabled,
      detail: health.liveAnalysisEnabled
        ? `Enabled with ${health.model}.`
        : health.hasApiKey
          ? "API key is present, but live analysis remains disabled until QWEN_LIVE_ANALYSIS=true."
          : "Missing DASHSCOPE_API_KEY; deterministic offline analysis is serving requests.",
    }),
    createCheck({
      id: "share-storage",
      label: "Durable share links",
      status: kvConfigured ? "ready" : "fallback",
      active: kvConfigured,
      detail: kvConfigured
        ? "KV REST storage is configured for short share links."
        : `Using in-memory share storage with ${shareConfig.idLength}-character IDs; links can disappear after cold starts or redeploys.`,
    }),
    createCheck({
      id: "github-gist",
      label: "GitHub Gist export",
      status: gistConfigured ? "ready" : "fallback",
      active: gistConfigured,
      detail: gistConfigured
        ? "GITHUB_TOKEN is present for server-side gist export."
        : "Missing GITHUB_TOKEN; users can still copy, download TSX, and use local zip fallback.",
    }),
    createCheck({
      id: "github-repo",
      label: "GitHub repo export",
      status: repoExportConfigured ? "ready" : "fallback",
      active: repoExportConfigured,
      detail: repoExportConfigured
        ? "Repo compare export can use GitHub credentials."
        : "Repo export falls back to a downloaded scaffold zip.",
    }),
    createCheck({
      id: "public-site-url",
      label: "Canonical site URL",
      status: publicSiteConfigured ? "ready" : "fallback",
      active: publicSiteConfigured,
      detail: publicSiteConfigured
        ? "Short share URLs can be built with the configured host."
        : "Short share URLs fall back to localhost unless NEXT_PUBLIC_SITE_URL or Vercel production URL is set.",
    }),
  ];

  const summary = checks.reduce(
    (counts, check) => ({
      ...counts,
      [check.status]: counts[check.status] + 1,
    }),
    { ready: 0, optional: 0, fallback: 0, missing: 0 },
  );

  const lowestStatus = checks.reduce(
    (lowest, check) =>
      statusRank(check.status) < statusRank(lowest) ? check.status : lowest,
    "ready",
  );

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    provider: health.provider,
    liveAnalysisEnabled: health.liveAnalysisEnabled,
    hasQwenApiKey: health.hasApiKey,
    qwenModel: health.model,
    shareStorage: kvConfigured ? "kv" : "memory",
    durableShareLinks: kvConfigured,
    overallStatus: lowestStatus,
    summary,
    checks,
    docs: [
      "/docs/ops/PRODUCTION_ENV_READINESS.md",
      "/docs/ops/SHARE_LINKS.md",
      "/docs/ops/PRODUCTION_SETUP_CHECKLIST.md",
    ],
  };
}
