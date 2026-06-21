import {
  buildShareableSummary,
  decodeShareHash,
  SHARE_SESSION_KEY,
} from "./share-result.mjs";

type ShareableResultSummary = NonNullable<ReturnType<typeof buildShareableSummary>>;

export function persistShareSummary(payload: ShareableResultSummary) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SHARE_SESSION_KEY, JSON.stringify(payload));
  } catch {
    // quota / private mode
  }
}

export function readShareFromSession(): ShareableResultSummary | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SHARE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return buildShareableSummary({
      summary: parsed?.summary,
      previewStats: Array.isArray(parsed?.stats)
        ? parsed.stats.map((stat: { l?: unknown; v?: unknown }) => ({
            label: stat.l,
            value: stat.v,
          }))
        : [],
      modeLabel: parsed?.mode,
      file: parsed?.file,
      detections: parsed?.detections,
    });
  } catch {
    return null;
  }
}

export function readShareFromLocation(hash?: string): ShareableResultSummary | null {
  if (typeof hash === "string") {
    return decodeShareHash(hash);
  }
  if (typeof window === "undefined") return null;
  return decodeShareHash(window.location.hash);
}
