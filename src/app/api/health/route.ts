import { canUseLiveQwen, getQwenConfig } from "@/lib/qwen-analyze.mjs";

export const runtime = "nodejs";

export async function GET() {
  const config = getQwenConfig();
  const liveAnalysisEnabled = canUseLiveQwen();

  return Response.json({
    ok: true,
    provider: liveAnalysisEnabled ? "qwen" : "demo",
    hasApiKey: config.ok,
    liveAnalysisEnabled,
    model: liveAnalysisEnabled ? config.model : null,
    baseUrl: liveAnalysisEnabled ? config.baseUrl : null,
  });
}
