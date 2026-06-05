/**
 * Server-side GitHub repo export helpers (compare URL stub + zip fallback).
 */

import { sanitizeGistFilename } from "./github-gist.mjs";

export const DEFAULT_GITHUB_EXPORT_REPO = "Iron-Mark/qwen-ui-lab";
export const DEFAULT_GITHUB_EXPORT_BASE = "main";

export const REPO_EXPORT_COMPARE_INSTRUCTIONS =
  "Use the compare view: create the export branch, add your scaffold file, paste code from the panel, and open a pull request.";

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
  description = "qwen-ui-lab scaffold export",
}) {
  const safeFilename = sanitizeGistFilename(filename);
  const head = `qwen-ui-lab-export-${Date.now()}`;
  const title = encodeURIComponent("Add qwen-ui-lab scaffold");
  const body = encodeURIComponent(
    [
      "## qwen-ui-lab export",
      "",
      description,
      "",
      `Add \`${safeFilename}\` from the export panel.`,
      "",
      "### Steps",
      `1. Create branch \`${head}\` from \`${base}\`.`,
      `2. Add \`${safeFilename}\` with your generated scaffold.`,
      "3. Open a pull request.",
      "",
      "---",
      "_Compare link stub — paste scaffold content manually._",
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
export function buildScaffoldReadme({ filename, description = "qwen-ui-lab scaffold export" }) {
  const safeFilename = sanitizeGistFilename(filename);
  return `# qwen-ui-lab scaffold export

${description}

## Files

- \`${safeFilename}\` — generated React + Tailwind scaffold

## Next steps

1. Unzip this archive into your app (for example \`src/components/\`).
2. Install any missing dependencies referenced in the scaffold.
3. Adjust imports and routes to match your project structure.

Exported from [qwen-ui-lab](https://github.com/${DEFAULT_GITHUB_EXPORT_REPO}).
`;
}

/**
 * @param {{
 *   content: string;
 *   filename: string;
 *   description?: string;
 * }} args
 * @returns {{ name: string; content: string }[]}
 */
export function buildScaffoldZipEntries({ content, filename, description }) {
  const safeFilename = sanitizeGistFilename(filename);
  return [
    { name: "README.md", content: buildScaffoldReadme({ filename: safeFilename, description }) },
    { name: safeFilename, content },
  ];
}
