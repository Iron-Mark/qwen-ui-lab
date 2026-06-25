import { buildAnalyzeHealthResponse } from "../../analysis/lib/qwen-analyze.mjs";
import { canUseGithubGist } from "../../export/lib/github-gist.mjs";
import { canUseGithubRepoExport } from "../../export/lib/github-repo.mjs";
import {
  getShareStoreConfig,
  isShareKvConfigured,
} from "../../share/lib/share-store.mjs";
import { resolvePublicSiteUrl } from "../../../lib/public-site-url.mjs";

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
  const publicSite = resolvePublicSiteUrl(env);
  const publicSiteReady =
    publicSite.configured &&
    publicSite.valid &&
    publicSite.https &&
    !publicSite.local &&
    publicSite.originOnly;
  const publicSiteMisconfigured =
    publicSite.configured &&
    (!publicSite.valid ||
      !publicSite.originOnly ||
      (!publicSite.local && !publicSite.https));

  const checks = [
    createCheck({
      id: "demo-fallback",
      label: "Local analysis fallback",
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
          : "Provider credentials are missing; deterministic local analysis is serving requests.",
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
        : "Repo export falls back to a downloaded starter package.",
    }),
    createCheck({
      id: "public-site-url",
      label: "Canonical site URL",
      status: publicSiteReady
        ? "ready"
        : publicSiteMisconfigured
          ? "missing"
          : "fallback",
      active: publicSiteReady,
      detail: publicSiteReady
        ? `Canonical metadata and short share URLs use ${publicSite.normalized}.`
        : publicSiteMisconfigured
          ? `${publicSite.source} must be a valid HTTPS public origin.`
          : publicSite.local
            ? "Canonical URLs are pointing at localhost; set NEXT_PUBLIC_SITE_URL before production deploys."
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
    publicSiteUrl: publicSite.valid ? publicSite.normalized : null,
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
