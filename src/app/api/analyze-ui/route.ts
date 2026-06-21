import { handleAnalyzeUiPost } from "@/features/analysis/lib/analyze-ui-api.mjs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleAnalyzeUiPost(request);
}
