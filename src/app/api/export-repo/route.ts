import {
  buildRepoCompareExport,
  buildScaffoldZipEntries,
  canUseGithubRepoExport,
  getGithubRepoExportConfig,
} from "@/features/export/lib/github-repo.mjs";
import { sanitizeGistFilename } from "@/features/export/lib/github-gist.mjs";
import {
  createStoredZip,
  SCAFFOLD_ZIP_FILENAME,
} from "@/features/export/lib/scaffold-zip.mjs";

export const runtime = "nodejs";

const MAX_CONTENT_BYTES = 512 * 1024;

export async function GET() {
  return Response.json({
    ok: true,
    available: canUseGithubRepoExport(),
    mode: canUseGithubRepoExport() ? "compare" : "zip",
  });
}

export async function POST(request: Request) {
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

  if (canUseGithubRepoExport()) {
    const config = getGithubRepoExportConfig();
    if (!config) {
      return Response.json(
        {
          ok: false,
          code: "invalid_repo_config",
          message:
            "GITHUB_EXPORT_REPO must be owner/repo (for example Iron-Mark/qwen-ui-lab).",
        },
        { status: 500 },
      );
    }

    const compare = buildRepoCompareExport({
      owner: config.owner,
      repo: config.repo,
      base: config.base,
      filename: payload.filename,
      description: payload.description,
    });

    return Response.json({
      ok: true,
      mode: "compare",
      url: compare.url,
      branch: compare.branch,
      instructions: compare.instructions,
    });
  }

  const zipEntries = buildScaffoldZipEntries({
    content: payload.content,
    filename: payload.filename,
    description: payload.description,
  });
  const zipBytes = createStoredZip(zipEntries);

  return new Response(Buffer.from(zipBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${SCAFFOLD_ZIP_FILENAME}"`,
      "Cache-Control": "no-store",
    },
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
