import { canUseLiveQwen, getQwenConfig, isLiveQwenAnalysisEnabled } from "./qwen-analyze.mjs";

const WARN_PREFIX = "[qwen-ui-lab env]";

/**
 * Log warnings for missing or suspicious Qwen configuration at dev boot.
 * @param {NodeJS.ProcessEnv} [env]
 */
export function validateEnvOnBoot(env = process.env) {
  if (env.NODE_ENV === "production") return;

  const config = getQwenConfig(env);

  if (!config.ok) {
    console.warn(
      `${WARN_PREFIX} DASHSCOPE_API_KEY is not set — analyze uses instant offline demo mode.`,
    );
    return;
  }

  if (!isLiveQwenAnalysisEnabled(env)) {
    console.warn(
      `${WARN_PREFIX} DASHSCOPE_API_KEY is set but QWEN_LIVE_ANALYSIS is not enabled — no upstream Qwen calls (demo mode). Set QWEN_LIVE_ANALYSIS=true to spend API credits.`,
    );
    return;
  }

  const baseUrl = env.QWEN_BASE_URL || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
  try {
    new URL(baseUrl);
  } catch {
    console.warn(
      `${WARN_PREFIX} QWEN_BASE_URL is not a valid URL: ${baseUrl}`,
    );
    return;
  }

  if (canUseLiveQwen(env)) {
    console.info(
      `${WARN_PREFIX} Live Qwen enabled (model: ${config.model}, host: ${new URL(baseUrl).host}).`,
    );
  }
}
