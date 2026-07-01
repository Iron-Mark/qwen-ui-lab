export const DEFAULT_QWEN_BASE_URL =
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
export const DEFAULT_QWEN_MODEL = "qwen3-vl-plus";

/** True only when QWEN_LIVE_ANALYSIS=true or USE_LIVE_QWEN=1; API key alone does not enable upstream calls. */
export function isLiveQwenAnalysisEnabled(env = process.env) {
  const raw = env.QWEN_LIVE_ANALYSIS ?? env.USE_LIVE_QWEN;
  if (raw === undefined || raw === "") return false;
  const normalized = String(raw).trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

/** Server may call Qwen vision only when key is set and live analysis is explicitly opted in. */
export function canUseLiveQwen(env = process.env) {
  return getQwenConfig(env).ok && isLiveQwenAnalysisEnabled(env);
}

export function getQwenConfig(env = process.env) {
  const apiKey = env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      missing: "DASHSCOPE_API_KEY",
    };
  }

  return {
    ok: true,
    apiKey,
    baseUrl: env.QWEN_BASE_URL || DEFAULT_QWEN_BASE_URL,
    model: env.QWEN_MODEL || DEFAULT_QWEN_MODEL,
  };
}
