const SECRET_ASSIGNMENT_PATTERN =
  /\b(DASHSCOPE_API_KEY|QWEN_API_KEY|OPENAI_API_KEY|GITHUB_TOKEN|KV_REST_API_TOKEN|SENTRY_DSN)\s*[:=]\s*["']?[^"'\s,;]+/gi;
const GENERIC_SECRET_ASSIGNMENT_PATTERN =
  /\b(api[_-]?key|token|secret|password)\s*[:=]\s*["']?[^"'\s,;]+/gi;
const SHARE_HASH_PATTERN = /#share=[A-Za-z0-9._~+/=-]+/g;
const WINDOWS_PATH_PATTERN = /[A-Za-z]:\\(?:[^\\/:*?"<>|\s]+\\)*[^\\/:*?"<>|\s]*/g;
const UNIX_USER_PATH_PATTERN = /\/(?:Users|home)\/[^\s"'<>#]+/g;

export function redactSensitiveText(value, options = {}) {
  const localPathReplacement =
    typeof options.localPathReplacement === "string"
      ? options.localPathReplacement
      : "[local path]";

  return String(value ?? "")
    .replace(SHARE_HASH_PATTERN, "#share=<redacted>")
    .replace(WINDOWS_PATH_PATTERN, localPathReplacement)
    .replace(UNIX_USER_PATH_PATTERN, localPathReplacement)
    .replace(SECRET_ASSIGNMENT_PATTERN, "$1=<redacted>")
    .replace(GENERIC_SECRET_ASSIGNMENT_PATTERN, "$1=<redacted>");
}
