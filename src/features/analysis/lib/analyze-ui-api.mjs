import {
  checkAnalyzeUiRateLimit,
  getRequestClientIp,
} from "./analyze-ui-rate-limit.mjs";
import {
  normalizeAnalyzeRequestBody,
  validateAnalyzeContentLength,
} from "./analyze-request-validation.mjs";
import { analyzeUiImageWithQwen, canUseLiveQwen } from "./qwen-analyze.mjs";
import { readJsonRequestBody } from "../../../lib/api-request.mjs";

function responseStatusFromResult(result) {
  return "status" in result && typeof result.status === "number"
    ? result.status
    : 500;
}

export async function handleAnalyzeUiPost(request) {
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
          message: `Too many screenshot analyses from this client. Try again in ${rate.retryAfterSec} seconds.`,
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

  const body = await readJsonRequestBody(request);
  if (!body.ok) {
    return Response.json(body.error, { status: 400 });
  }

  const payload = normalizeAnalyzeRequestBody(body.body);
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
        message: "Unexpected error while contacting the remote vision service.",
      },
      { status: 503 },
    );
  }

  if (!result.ok) {
    return Response.json(result, { status: responseStatusFromResult(result) });
  }

  return Response.json(result);
}
