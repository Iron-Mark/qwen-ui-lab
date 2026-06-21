export const INVALID_JSON_REQUEST_ERROR = {
  ok: false,
  code: "invalid_json",
  message: "Request body must be JSON.",
};

/**
 * @param {{ json: () => Promise<unknown> }} request
 * @returns {Promise<{ ok: true; body: unknown } | { ok: false; error: typeof INVALID_JSON_REQUEST_ERROR }>}
 */
export async function readJsonRequestBody(request) {
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return { ok: false, error: INVALID_JSON_REQUEST_ERROR };
  }
}
