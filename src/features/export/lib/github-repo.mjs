/**
 * Server-side GitHub repo export helpers (compare URL + package download fallback).
 */
import { sanitizeScaffoldFilename } from "./scaffold-filename.mjs";
import { redactSensitiveText } from "../../../lib/privacy-redaction.mjs";
import {
  buildScaffoldReadme as buildPackageScaffoldReadme,
  DEFAULT_EXPORT_PACKAGE_DESCRIPTION,
  DEFAULT_EXPORT_SOURCE_REPO,
} from "./scaffold-package-docs.mjs";

export const DEFAULT_GITHUB_EXPORT_REPO = DEFAULT_EXPORT_SOURCE_REPO;
export const DEFAULT_GITHUB_EXPORT_BASE = "main";
export { DEFAULT_EXPORT_PACKAGE_DESCRIPTION };
export { extractProductionScaffoldBlueprint } from "./scaffold-blueprint.mjs";
export {
  buildScaffoldPackageFileMap,
  buildScaffoldZipEntries,
} from "./scaffold-package.mjs";

export const REPO_EXPORT_COMPARE_INSTRUCTIONS =
  "Use the compare view: create the starter branch, add the package files from the package panel, and open a pull request.";

/**
 * @param {Record<string, string | undefined>} [env]
 */
export function canUseGithubRepoExport(env = process.env) {
  return Boolean(env.GITHUB_TOKEN?.trim());
}

/**
 * @param {string} slug
 */
export function parseGithubRepoSlug(slug) {
  const trimmed = String(slug || "").trim();
  const match = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(trimmed);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

/**
 * @param {Record<string, string | undefined>} [env]
 */
export function getGithubRepoExportConfig(env = process.env) {
  const slug =
    env.GITHUB_EXPORT_REPO?.trim() || DEFAULT_GITHUB_EXPORT_REPO;
  const parsed = parseGithubRepoSlug(slug);
  if (!parsed) return null;

  const base =
    env.GITHUB_EXPORT_BASE?.trim() || DEFAULT_GITHUB_EXPORT_BASE;

  return {
    ...parsed,
    base: base.replace(/^refs\/heads\//, ""),
  };
}

/**
 * @param {{
 *   owner: string;
 *   repo: string;
 *   base: string;
 *   filename: string;
 *   description?: string;
 * }} args
 */
export function buildRepoCompareExport({
  owner,
  repo,
  base,
  filename,
  description = DEFAULT_EXPORT_PACKAGE_DESCRIPTION,
}) {
  const safeFilename = sanitizeScaffoldFilename(filename);
  const safeDescription =
    redactSensitiveText(description).trim().slice(0, 256) ||
    DEFAULT_EXPORT_PACKAGE_DESCRIPTION;
  const head = `qwen-ui-lab-starter-${Date.now()}`;
  const title = encodeURIComponent("Add screenshot-to-React starter package");
  const body = encodeURIComponent(
    [
      "## Screenshot-to-React starter package",
      "",
      safeDescription,
      "",
      `Add \`${safeFilename}\` from the downloaded package.`,
      "",
      "### Steps",
      `1. Create branch \`${head}\` from \`${base}\`.`,
      `2. Add \`${safeFilename}\` with the starter UI package.`,
      "3. Open a pull request.",
      "",
      "---",
      "_Compare link helper - add the package files from the package panel._",
    ].join("\n"),
  );

  const url = `https://github.com/${owner}/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}?expand=1&title=${title}&body=${body}`;

  return {
    url,
    branch: head,
    filename: safeFilename,
    instructions: REPO_EXPORT_COMPARE_INSTRUCTIONS,
  };
}

/**
 * @param {{
 *   filename: string;
 *   description?: string;
 * }} args
 */
export function buildScaffoldReadme({
  filename,
  description = DEFAULT_EXPORT_PACKAGE_DESCRIPTION,
}) {
  const safeFilename = sanitizeScaffoldFilename(filename);
  const safeDescription =
    redactSensitiveText(description).trim().slice(0, 256) ||
    DEFAULT_EXPORT_PACKAGE_DESCRIPTION;
  return buildPackageScaffoldReadme({
    filename: safeFilename,
    description: safeDescription,
    sourceRepo: DEFAULT_GITHUB_EXPORT_REPO,
  });
}
