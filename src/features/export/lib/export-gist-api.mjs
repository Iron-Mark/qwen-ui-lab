import {
  buildGithubGistUnavailablePayload,
  canUseGithubGist,
  createGithubGist,
  getGithubGistToken,
} from "./github-gist.mjs";
import { normalizeScaffoldExportRequestBody } from "./scaffold-export-request.mjs";
import { readJsonRequestBody } from "../../../lib/api-request.mjs";

export function handleGistExportGet() {
  return Response.json({
    ok: true,
    available: canUseGithubGist(),
  });
}

export async function handleGistExportPost(request) {
  const body = await readJsonRequestBody(request);
  if (!body.ok) {
    return Response.json(body.error, { status: 400 });
  }

  const payload = normalizeScaffoldExportRequestBody(body.body);
  if (!payload.ok) {
    return Response.json(payload, { status: 400 });
  }

  const token = getGithubGistToken();
  if (!token) {
    return Response.json(buildGithubGistUnavailablePayload(), { status: 503 });
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
