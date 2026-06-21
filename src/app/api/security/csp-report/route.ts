import { headers } from "next/headers";
import { handleCspReportPost } from "@/lib/csp-report.mjs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleCspReportPost(request, { headers: await headers() });
}
