import { headers } from "next/headers";

export const runtime = "nodejs";

type CspPayload = Record<string, unknown> & {
  "csp-report"?: Record<string, unknown>;
};

export async function POST(request: Request) {
  let payload: CspPayload | null = null;

  try {
    payload = (await request.json()) as CspPayload;
  } catch {
    // Ignore invalid reports to avoid surfacing noisy parse failures.
  }

  if (payload) {
    const requestHeaders = await headers();
    const report = payload["csp-report"] ?? payload;
    const sourceIp = requestHeaders.get("x-forwarded-for") ?? "unknown";
    console.warn("CSP report-only violation", {
      sourceIp,
      documentUri: report["document-uri"],
      violatedDirective: report["violated-directive"],
      blockedUri: report["blocked-uri"],
      userAgent: requestHeaders.get("user-agent"),
    });
  }

  return new Response(null, { status: 204 });
}
