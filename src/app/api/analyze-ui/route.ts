import {
  checkAnalyzeUiRateLimit,
  getRequestClientIp,
} from "@/features/analysis/lib/analyze-ui-rate-limit.mjs";
import {
  normalizeAnalyzeRequestBody,
  validateAnalyzeContentLength,
} from "@/features/analysis/lib/analyze-request-validation.mjs";
import { analyzeUiImageWithQwen, canUseLiveQwen } from "@/features/analysis/lib/qwen-analyze.mjs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const contentLength = validateAnalyzeContentLength(
    request.headers.get("content-length"),
  );
  if (!contentLength.ok) {
    return Response.json(contentLength, { status: contentLength.status });
  }

  if (canUseLiveQwen()) {
    const rate = await checkAnalyzeUiRateLimit({
      clientKey: getRequestClientIp(request),
    });

    if (!rate.allowed) {
      return Response.json(
        {
          ok: false,
          code: "rate_limit_exceeded",
          message: `Too many live analysis requests from this client. Try again in ${rate.retryAfterSec} seconds.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rate.retryAfterSec),
            "X-RateLimit-Limit": String(rate.limit),
          },
        },
      );
    }
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, code: "invalid_json", message: "Request body must be JSON." },
      { status: 400 },
    );
  }

  const payload = normalizeAnalyzeRequestBody(body);

  if (!payload.ok) {
    return Response.json(payload, { status: payload.status });
  }

  let result;
  try {
    result = await analyzeUiImageWithQwen(payload.data);
  } catch {
    return Response.json(
      {
        ok: false,
        status: 503,
        code: "qwen_network_error",
        message: "Unexpected error while calling Qwen.",
      },
      { status: 503 },
    );
  }

  if (!result.ok) {
    const status =
      "status" in result && typeof result.status === "number"
        ? result.status
        : 500;
    return Response.json(result, { status });
  }

  return Response.json(result);
}
