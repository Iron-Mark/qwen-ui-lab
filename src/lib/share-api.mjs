import {
  createShareRecord,
  getShareRecord,
  sanitizeSharePayload,
} from "./share-store.mjs";
import { buildShortShareUrl } from "./share-result.mjs";

function shareJsonResponse(body, status = 200) {
  return Response.json(body, { status });
}

function getSiteUrlFromEnv(env = process.env) {
  const envUrl = env.NEXT_PUBLIC_SITE_URL ?? env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!envUrl) return "http://localhost:3000";
  const withProtocol = envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;
  return withProtocol.replace(/\/+$/, "");
}

export async function handleShareGet(request) {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return shareJsonResponse({ ok: false, error: "Missing id query parameter" }, 400);
  }

  const summary = await getShareRecord(id);
  if (!summary) {
    return shareJsonResponse({ ok: false, error: "Share not found" }, 404);
  }

  return shareJsonResponse({ ok: true, id, summary });
}

export async function handleSharePost(request, env = process.env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return shareJsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const summary = sanitizeSharePayload(body);
  if (!summary) {
    return shareJsonResponse(
      { ok: false, error: "Invalid or empty share payload" },
      400,
    );
  }

  const created = await createShareRecord(summary, { env });
  if (!created) {
    return shareJsonResponse({ ok: false, error: "Could not create share" }, 500);
  }

  const origin = getSiteUrlFromEnv(env);
  return shareJsonResponse(
    {
      ok: true,
      id: created.id,
      url: buildShortShareUrl(origin, created.id),
    },
    201,
  );
}
