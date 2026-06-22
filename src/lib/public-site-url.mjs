function trim(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

export function normalizePublicUrl(raw) {
  const trimmed = trim(raw);
  if (!trimmed) return "";
  return trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed.replace(/\/+$/, "")
    : `https://${trimmed.replace(/\/+$/, "")}`;
}

export function resolvePublicSiteUrl(env = process.env) {
  const source = trim(env.NEXT_PUBLIC_SITE_URL)
    ? "NEXT_PUBLIC_SITE_URL"
    : trim(env.VERCEL_PROJECT_PRODUCTION_URL)
      ? "VERCEL_PROJECT_PRODUCTION_URL"
      : "";
  const raw = source ? trim(env[source]) : "";
  const normalized = normalizePublicUrl(raw);

  if (!normalized) {
    return {
      source,
      raw,
      normalized,
      configured: false,
      valid: false,
      https: false,
      local: false,
      originOnly: false,
    };
  }

  try {
    const url = new URL(normalized);
    return {
      source,
      raw,
      normalized,
      configured: true,
      valid: url.protocol === "https:" || url.protocol === "http:",
      https: url.protocol === "https:",
      local: ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(
        url.hostname,
      ),
      originOnly: url.pathname === "/" && !url.search && !url.hash,
    };
  } catch {
    return {
      source,
      raw,
      normalized,
      configured: true,
      valid: false,
      https: false,
      local: false,
      originOnly: false,
    };
  }
}
