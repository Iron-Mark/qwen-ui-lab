/**
 * Server-side GitHub repo export helpers (compare URL + package download fallback).
 */
import { sanitizeScaffoldFilename } from "./scaffold-filename.mjs";
import { DEFAULT_EXPORT_PACKAGE_DESCRIPTION, DEFAULT_EXPORT_SOURCE_REPO } from "./scaffold-package-docs.mjs";

export const DEFAULT_GITHUB_EXPORT_REPO = DEFAULT_EXPORT_SOURCE_REPO;
export const DEFAULT_GITHUB_EXPORT_BASE = "main";
export { DEFAULT_EXPORT_PACKAGE_DESCRIPTION };
export { extractProductionScaffoldBlueprint } from "./scaffold-blueprint.mjs";
export {
  buildScaffoldPackageFileMap,
  buildScaffoldZipEntries,
} from "./scaffold-package.mjs";

export const REPO_EXPORT_COMPARE_INSTRUCTIONS =
  "Use the compare view: create the export branch, add the generated component, paste code from the panel, and open a pull request.";

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
  const head = `qwen-ui-lab-export-${Date.now()}`;
  const title = encodeURIComponent("Add screenshot UI starter package");
  const body = encodeURIComponent(
    [
      "## Screenshot UI starter package",
      "",
      description,
      "",
      `Add \`${safeFilename}\` from the export package.`,
      "",
      "### Steps",
      `1. Create branch \`${head}\` from \`${base}\`.`,
      `2. Add \`${safeFilename}\` with the generated UI package.`,
      "3. Open a pull request.",
      "",
      "---",
      "_Compare link helper - paste package contents manually._",
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
  return `# Screenshot UI starter package

${description}

This export is a reviewable package. Import it into source control, connect real data, and compare the result against the screenshot before shipping.

## Files

- \`README.md\` - package overview and import checklist
- \`DESIGN.md\` - design notes, review items, and responsive assumptions
- \`${safeFilename}\` - generated React + Tailwind component

## Next steps

1. Unzip this export package into your app.
2. Install any missing dependencies referenced by the component.
3. Adjust imports and routes to match your project structure.
4. Review the design notes and detection notes before treating the component as final.

Exported from [qwen-ui-lab](https://github.com/${DEFAULT_GITHUB_EXPORT_REPO}).
`;
}
