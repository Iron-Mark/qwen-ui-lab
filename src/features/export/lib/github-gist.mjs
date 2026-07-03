/**
 * Server-side GitHub Gist helpers for starter UI package exports.
 */

import { DEFAULT_EXPORT_PACKAGE_DESCRIPTION } from "./scaffold-package-docs.mjs";
import { sanitizeScaffoldFilename } from "./scaffold-filename.mjs";

export const GIST_FALLBACK_URL = "https://gist.github.com";

export const GIST_FALLBACK_INSTRUCTIONS =
  "Open GitHub Gist when you want a shareable secret link.";

export function buildGithubGistUnavailablePayload() {
  return {
    ok: false,
    code: "gist_unavailable",
    message:
      "GitHub Gist export needs setup before automatic links are available.",
    fallback: {
      gistUrl: GIST_FALLBACK_URL,
      instructions: GIST_FALLBACK_INSTRUCTIONS,
    },
  };
}

/**
 * @param {Record<string, string | undefined>} [env]
 */
export function canUseGithubGist(env = process.env) {
  return Boolean(env.GITHUB_TOKEN?.trim());
}

/**
 * @param {Record<string, string | undefined>} [env]
 */
export function getGithubGistToken(env = process.env) {
  const token = env.GITHUB_TOKEN?.trim();
  return token || null;
}

/**
 * @param {{
 *   token: string;
 *   description?: string;
 *   filename: string;
 *   content: string;
 *   isPublic?: boolean;
 *   fetchImpl?: typeof fetch;
 * }} args
 */
export async function createGithubGist({
  token,
  description = DEFAULT_EXPORT_PACKAGE_DESCRIPTION,
  filename,
  content,
  isPublic = false,
  fetchImpl = fetch,
}) {
  const safeFilename = sanitizeScaffoldFilename(filename);
  const response = await fetchImpl("https://api.github.com/gists", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "qwen-ui-lab",
    },
    body: JSON.stringify({
      description,
      public: isPublic,
      files: {
        [safeFilename]: { content },
      },
    }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload?.message ||
      `GitHub API responded with status ${response.status}.`;
    return {
      ok: false,
      status: response.status,
      message,
    };
  }

  const htmlUrl = payload?.html_url;
  if (!htmlUrl || typeof htmlUrl !== "string") {
    return {
      ok: false,
      status: response.status,
      message: "GitHub API did not return a gist URL.",
    };
  }

  return {
    ok: true,
    url: htmlUrl,
    id: payload.id ?? null,
  };
}

export { sanitizeScaffoldFilename as sanitizeGistFilename } from "./scaffold-filename.mjs";
