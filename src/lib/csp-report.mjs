export function normalizeCspReportPayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  const report = payload["csp-report"] ?? payload;
  return {
    documentUri: report["document-uri"],
    violatedDirective: report["violated-directive"],
    blockedUri: report["blocked-uri"],
  };
}

export function isLocalCspDocumentUri(documentUri) {
  if (typeof documentUri !== "string") return false;

  try {
    const { hostname } = new URL(documentUri);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.endsWith(".localhost")
    );
  } catch {
    return false;
  }
}

async function readCspReportPayload(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/**
 * @param {Request} request
 * @param {{
 *   headers?: { get(name: string): string | null };
 *   logger?: { warn(...args: unknown[]): void };
 * }} [options]
 */
export async function handleCspReportPost(
  request,
  { headers, logger = console } = {},
) {
  const report = normalizeCspReportPayload(await readCspReportPayload(request));

  if (report && !isLocalCspDocumentUri(report.documentUri)) {
    logger.warn("CSP report-only violation", {
      sourceIp: headers?.get("x-forwarded-for") ?? "unknown",
      documentUri: report.documentUri,
      violatedDirective: report.violatedDirective,
      blockedUri: report.blockedUri,
      userAgent: headers?.get("user-agent"),
    });
  }

  return new Response(null, { status: 204 });
}
