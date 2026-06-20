import { handleShareGet, handleSharePost } from "@/features/share/lib/share-api.mjs";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleShareGet(request);
}

export async function POST(request: Request) {
  return handleSharePost(request);
}
