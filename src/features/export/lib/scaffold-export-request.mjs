import { sanitizeGistFilename } from "./github-gist.mjs";

export const MAX_SCAFFOLD_EXPORT_CONTENT_BYTES = 512 * 1024;

/**
 * @param {unknown} body
 * @returns {{
 *   ok: true;
 *   content: string;
 *   filename: string;
 *   description: string;
 *   mode: "auto" | "zip";
 * } | { ok: false; code: string; message: string }}
 */
export function normalizeScaffoldExportRequestBody(body) {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      code: "invalid_body",
      message: "Request body must be a JSON object.",
    };
  }

  const record = /** @type {Record<string, unknown>} */ (body);
  const content = typeof record.content === "string" ? record.content : "";
  const filename =
    typeof record.filename === "string"
      ? sanitizeGistFilename(record.filename)
      : "component.tsx";
  const description =
    typeof record.description === "string" && record.description.trim()
      ? record.description.trim().slice(0, 256)
      : "qwen-ui-lab starter package";
  const mode = record.mode === "zip" ? "zip" : "auto";

  if (!content.trim()) {
    return {
      ok: false,
      code: "missing_content",
      message: "Component content is required.",
    };
  }

  const bytes = new TextEncoder().encode(content).byteLength;
  if (bytes > MAX_SCAFFOLD_EXPORT_CONTENT_BYTES) {
    return {
      ok: false,
      code: "content_too_large",
      message: `Component exceeds ${MAX_SCAFFOLD_EXPORT_CONTENT_BYTES} bytes.`,
    };
  }

  return {
    ok: true,
    content,
    filename,
    description,
    mode,
  };
}
