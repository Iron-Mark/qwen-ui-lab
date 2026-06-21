import {
  buildRepoCompareExport,
  buildScaffoldZipEntries,
  canUseGithubRepoExport,
  getGithubRepoExportConfig,
} from "./github-repo.mjs";
import { normalizeScaffoldExportRequestBody } from "./scaffold-export-request.mjs";
import {
  createStoredZip,
  SCAFFOLD_ZIP_FILENAME,
} from "./scaffold-zip.mjs";
import { readJsonRequestBody } from "../../../lib/api-request.mjs";

export function handleRepoExportGet() {
  return Response.json({
    ok: true,
    available: canUseGithubRepoExport(),
    mode: canUseGithubRepoExport() ? "compare" : "zip",
  });
}

export async function handleRepoExportPost(request) {
  const body = await readJsonRequestBody(request);
  if (!body.ok) {
    return Response.json(body.error, { status: 400 });
  }

  const payload = normalizeScaffoldExportRequestBody(body.body);
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
