import { handleReadinessGet } from "@/features/ops/lib/readiness-api.mjs";

export const runtime = "nodejs";

export async function GET() {
  return handleReadinessGet();
}
