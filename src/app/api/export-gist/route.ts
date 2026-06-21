import {
  handleGistExportGet,
  handleGistExportPost,
} from "@/features/export/lib/export-gist-api.mjs";

export const runtime = "nodejs";

export async function GET() {
  return handleGistExportGet();
}

export async function POST(request: Request) {
  return handleGistExportPost(request);
}
