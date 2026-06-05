import {
  checkAnalyzeUiRateLimit,
  getRequestClientIp,
} from "@/lib/analyze-ui-rate-limit.mjs";
import { analyzeUiImageWithQwen, canUseLiveQwen } from "@/lib/qwen-analyze.mjs";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  if (canUseLiveQwen()) {
    const rate = checkAnalyzeUiRateLimit({
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

  const payload = normalizeRequestBody(body);

  if (!payload.ok) {
    return Response.json(payload, { status: 400 });
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

function normalizeRequestBody(body: unknown):
  | {
      ok: true;
      data: {
        imageDataUrl: string;
        fileName: string;
        fileType: string;
        fileSize: number;
      };
    }
  | { ok: false; code: string; message: string } {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      code: "invalid_body",
      message: "Request body must be an object.",
    };
  }

  const record = body as Record<string, unknown>;
  const imageDataUrl = record.imageDataUrl;
  const fileName = record.fileName;
  const fileType = record.fileType;
  const fileSize = record.fileSize;

  if (
    typeof imageDataUrl !== "string" ||
    !imageDataUrl.startsWith("data:image/")
  ) {
    return {
      ok: false,
      code: "invalid_image",
      message: "imageDataUrl must be an image data URL.",
    };
  }

  if (typeof fileName !== "string" || fileName.length === 0) {
    return {
      ok: false,
      code: "invalid_file_name",
      message: "fileName is required.",
    };
  }

  if (typeof fileType !== "string" || !fileType.startsWith("image/")) {
    return {
      ok: false,
      code: "invalid_file_type",
      message: "fileType must be an image MIME type.",
    };
  }

  if (
    typeof fileSize !== "number" ||
    !Number.isFinite(fileSize) ||
    fileSize <= 0 ||
    fileSize > MAX_IMAGE_BYTES
  ) {
    return {
      ok: false,
      code: "invalid_file_size",
      message: "fileSize must be between 1 byte and 4 MB.",
    };
  }

  return {
    ok: true,
    data: {
      imageDataUrl,
      fileName,
      fileType,
      fileSize,
    },
  };
}
