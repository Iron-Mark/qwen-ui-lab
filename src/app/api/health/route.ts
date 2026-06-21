import { handleAnalyzeHealthGet } from "@/features/analysis/lib/analyze-health-api.mjs";

export const runtime = "nodejs";

export async function GET() {
  return handleAnalyzeHealthGet();
}
