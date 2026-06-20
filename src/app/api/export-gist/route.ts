import {
  canUseGithubGist,
  createGithubGist,
  getGithubGistToken,
  GIST_FALLBACK_INSTRUCTIONS,
  GIST_FALLBACK_URL,
  sanitizeGistFilename,
} from "@/features/export/lib/github-gist.mjs";

export const runtime = "nodejs";

const MAX_CONTENT_BYTES = 512 * 1024;

export async function GET() {
  return Response.json({
    ok: true,
    available: canUseGithubGist(),
  });
}

export async function POST(request: Request) {
  if (!canUseGithubGist()) {
    return Response.json(
      {
        ok: false,
        code: "gist_unavailable",
        message:
          "GitHub Gist export is not configured. Set GITHUB_TOKEN on the server.",
        fallback: {
          gistUrl: GIST_FALLBACK_URL,
          instructions: GIST_FALLBACK_INSTRUCTIONS,
        },
      },
      { status: 503 },
    );
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

  const token = getGithubGistToken();
  if (!token) {
    return Response.json(
      {
        ok: false,
        code: "gist_unavailable",
        message:
          "GitHub Gist export is not configured. Set GITHUB_TOKEN on the server.",
        fallback: {
          gistUrl: GIST_FALLBACK_URL,
          instructions: GIST_FALLBACK_INSTRUCTIONS,
        },
      },
      { status: 503 },
    );
  }

  const result = await createGithubGist({
    token,
    description: payload.description,
    filename: payload.filename,
    content: payload.content,
  });

  if (!result.ok) {
    return Response.json(
      {
        ok: false,
        code: "gist_create_failed",
        message: result.message,
      },
      {
        status:
          typeof result.status === "number" &&
          result.status >= 400 &&
          result.status < 600
            ? result.status
            : 502,
      },
    );
  }

  return Response.json({
    ok: true,
    url: result.url,
    id: result.id,
  });
}

function normalizeRequestBody(body: unknown):
  | {
      ok: true;
      content: string;
      filename: string;
      description: string;
    }
  | { ok: false; code: string; message: string } {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      code: "invalid_body",
      message: "Request body must be a JSON object.",
    };
  }

  const record = body as Record<string, unknown>;
  const content = typeof record.content === "string" ? record.content : "";
  const filename =
    typeof record.filename === "string"
      ? sanitizeGistFilename(record.filename)
      : "component.tsx";
  const description =
    typeof record.description === "string" && record.description.trim()
      ? record.description.trim().slice(0, 256)
      : "qwen-ui-lab scaffold export";

  if (!content.trim()) {
    return {
      ok: false,
      code: "missing_content",
      message: "Scaffold content is required.",
    };
  }

  const bytes = new TextEncoder().encode(content).byteLength;
  if (bytes > MAX_CONTENT_BYTES) {
    return {
      ok: false,
      code: "content_too_large",
      message: `Scaffold exceeds ${MAX_CONTENT_BYTES} bytes.`,
    };
  }

  return {
    ok: true,
    content,
    filename,
    description,
  };
}
