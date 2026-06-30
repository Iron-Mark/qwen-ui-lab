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
      label: "Local analysis mode",
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
          ? "Credentials are present; live analysis is still disabled by configuration."
          : "Deterministic local analysis is serving requests.",
    }),
    createCheck({
      id: "share-storage",
      label: "Durable share links",
      status: kvConfigured ? "ready" : "fallback",
      active: kvConfigured,
      detail: kvConfigured
        ? "KV REST storage is configured for short share links."
        : `Using temporary share storage with ${shareConfig.idLength}-character IDs; links may not survive redeploys.`,
    }),
    createCheck({
      id: "github-gist",
      label: "GitHub Gist export",
      status: gistConfigured ? "ready" : "fallback",
      active: gistConfigured,
      detail: gistConfigured
        ? "GitHub export credentials are configured for gist publishing."
        : "Users can still copy code, download the component, or download the starter package.",
    }),
    createCheck({
      id: "github-repo",
      label: "GitHub repo export",
      status: repoExportConfigured ? "ready" : "fallback",
      active: repoExportConfigured,
      detail: repoExportConfigured
        ? "Repository compare export is configured."
        : "Repository export is available as a downloadable starter package.",
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
            ? "Canonical URLs are still local; set a public site URL before launch."
            : "Short share URLs use the current host until a public site URL is configured.",
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
