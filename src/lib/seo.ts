const DEFAULT_SITE_URL = "http://localhost:3000";

function normalizeUrl(rawUrl: string): string {
  const withProtocol = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
  return withProtocol.replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!envUrl) {
    return DEFAULT_SITE_URL;
  }
  return normalizeUrl(envUrl);
}
