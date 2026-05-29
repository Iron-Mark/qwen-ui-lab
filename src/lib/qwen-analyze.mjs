import { buildUiFlowArtifact } from "./ui-flow.mjs";

export const DEFAULT_QWEN_BASE_URL =
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
export const DEFAULT_QWEN_MODEL = "qwen3-vl-plus";

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

export function buildQwenVisionRequest({
  imageDataUrl,
  fileName,
  fileType,
  fileSize,
  model,
}) {
  return {
    model,
    messages: [
      {
        role: "system",
        content:
          "You analyze UI screenshots and return compact JSON only. Do not include markdown outside the JSON.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: [
              "Analyze this UI screenshot and produce a React/Tailwind component scaffold plan.",
              `File name: ${fileName}`,
              `File type: ${fileType}`,
              `File size: ${fileSize} bytes`,
              "Return JSON with keys: summary, plan, generatedCode, previewStats.",
              "plan must be an array of {title, body}.",
              "previewStats must be an array of {label, value}.",
            ].join("\n"),
          },
          {
            type: "image_url",
            image_url: {
              url: imageDataUrl,
            },
          },
        ],
      },
    ],
    temperature: 0.2,
  };
}

export function parseQwenAnalysisText(text) {
  const trimmed = String(text || "").trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const parsed = JSON.parse(unfenced);

  return normalizeQwenAnalysis(parsed);
}

export async function analyzeUiImageWithQwen({
  imageDataUrl,
  fileName,
  fileType,
  fileSize,
  env = process.env,
  fetchFn = fetch,
}) {
  const config = getQwenConfig(env);

  if (!config.ok) {
    return {
      ok: false,
      status: 503,
      code: "missing_qwen_api_key",
      message: `${config.missing} is not configured on the server.`,
    };
  }

  const endpoint = `${config.baseUrl.replace(/\/$/, "")}/chat/completions`;

  let response;
  try {
    response = await fetchFn(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        buildQwenVisionRequest({
          imageDataUrl,
          fileName,
          fileType,
          fileSize,
          model: config.model,
        }),
      ),
    });
  } catch (error) {
    return {
      ok: false,
      status: 503,
      code: "qwen_network_error",
      message:
        error?.name === "AbortError"
          ? "Qwen request timed out."
          : "Could not reach the Qwen API.",
    };
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      code: "qwen_request_failed",
      message:
        payload?.error?.message ||
        payload?.message ||
        "Qwen analysis request failed.",
    };
  }

  const modelText = extractQwenText(payload);

  if (!modelText.trim()) {
    return {
      ok: false,
      status: 502,
      code: "empty_qwen_response",
      message: "Qwen returned an empty analysis response.",
    };
  }

  try {
    const analysis = parseQwenAnalysisText(modelText);
    return {
      ok: true,
      artifact: buildUiFlowArtifact(
        {
          name: fileName,
          type: fileType,
          size: fileSize,
        },
        {
          plan: analysis.plan,
          generatedCode: analysis.generatedCode,
          previewStats: analysis.previewStats,
          modeLabel: `Qwen provider: ${config.model}`,
          summary: analysis.summary,
        },
      ),
      provider: {
        model: payload.model || config.model,
        baseUrl: config.baseUrl,
      },
    };
  } catch {
    return {
      ok: false,
      status: 502,
      code: "invalid_qwen_json",
      message: "Qwen returned text, but it was not valid analysis JSON.",
      rawText: modelText,
    };
  }
}

function extractQwenText(payload) {
  const content = payload?.choices?.[0]?.message?.content;

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part.text === "string") return part.text;
        return "";
      })
      .join("\n");
  }

  return typeof content === "string" ? content : "";
}

function normalizeQwenAnalysis(value) {
  return {
    summary: typeof value?.summary === "string" ? value.summary : "",
    plan: normalizeCards(value?.plan),
    generatedCode:
      typeof value?.generatedCode === "string"
        ? value.generatedCode
        : "export function GeneratedDashboard() { return null; }",
    previewStats: normalizeCards(value?.previewStats),
  };
}

function normalizeCards(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => ({
      title: String(item?.title || item?.label || "Item"),
      body: String(item?.body || item?.value || ""),
      label: String(item?.label || item?.title || "Item"),
      value: String(item?.value || item?.body || ""),
    }))
    .filter((item) => item.body || item.value);
}
