export const GITHUB_EXPORT_TOKEN_ENV_NAMES = [
  "GITHUB_GIST_TOKEN",
  "GITHUB_TOKEN",
];

/**
 * @param {Record<string, string | undefined>} [env]
 */
export function getGithubExportToken(env = process.env) {
  for (const name of GITHUB_EXPORT_TOKEN_ENV_NAMES) {
    const token = env[name]?.trim();
    if (token) return token;
  }
  return null;
}
