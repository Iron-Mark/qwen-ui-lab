/**
 * Server-side GitHub Gist helpers for generated UI package exports.
 */

export const GIST_FALLBACK_URL = "https://gist.github.com";

export const GIST_FALLBACK_INSTRUCTIONS =
  "Copy your generated component, open gist.github.com, paste into a new secret gist, and save.";

export function buildGithubGistUnavailablePayload() {
  return {
    ok: false,
    code: "gist_unavailable",
    message:
      "GitHub Gist export is not configured. Set GITHUB_TOKEN on the server.",
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
  description = "qwen-ui-lab export package",
  filename,
  content,
  isPublic = false,
  fetchImpl = fetch,
}) {
  const safeFilename = sanitizeGistFilename(filename);
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

/**
 * @param {string} filename
 */
export function sanitizeGistFilename(filename) {
  const basename = String(filename || "component.tsx")
    .trim()
    .split(/[/\\]+/)
    .pop();
  const base = String(basename || "component.tsx")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!base) return "component.tsx";
  if (base.endsWith(".tsx") || base.endsWith(".ts") || base.endsWith(".jsx")) {
    return base;
  }
  return `${base}.tsx`;
}
