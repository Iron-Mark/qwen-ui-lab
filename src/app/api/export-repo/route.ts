import {
  handleRepoExportGet,
  handleRepoExportPost,
} from "@/features/export/lib/export-repo-api.mjs";

export const runtime = "nodejs";

export async function GET() {
  return handleRepoExportGet();
}

export async function POST(request: Request) {
  return handleRepoExportPost(request);
}
