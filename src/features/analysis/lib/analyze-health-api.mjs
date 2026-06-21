import { buildAnalyzeHealthResponse } from "./qwen-analyze.mjs";

export function handleAnalyzeHealthGet() {
  return Response.json(buildAnalyzeHealthResponse());
}
