const DEFAULT_REVIEW_LABEL = "Analysis summary";
const DEFAULT_READY_LABEL = "Ready for review";
const INTERNAL_LABEL_PATTERNS = [
  /qwen/i,
  /provider/i,
  /api key/i,
  /fallback/i,
  /demo/i,
  /mock/i,
  /stub/i,
  /meetup/i,
  /local-first/i,
  /production-ready/i,
  /handoff bundle/i,
  /one-click demo/i,
  /route ready/i,
  /generated preview/i,
  /generated result/i,
  /generated scaffold/i,
  /generated scaffolds/i,
  /generated ui/i,
  /generated output/i,
  /full generated sample/i,
  /component generation/i,
  /finished-screen generator/i,
];

export function normalizeReviewStatusLabel(value, options = {}) {
  const fallback = typeof options.fallback === "string" ? options.fallback : DEFAULT_REVIEW_LABEL;
  const ready = typeof options.ready === "string" ? options.ready : DEFAULT_READY_LABEL;
  const maxLength = Number.isFinite(options.maxLength) ? Math.max(8, options.maxLength) : 60;
  const raw = String(value ?? "").trim();

  if (!raw) return fallback;
  if (INTERNAL_LABEL_PATTERNS.some((pattern) => pattern.test(raw))) return fallback;
  if (/ready to analyze/i.test(raw)) return ready;
  if (/local analysis/i.test(raw)) return "Local analysis";
  return raw.length > maxLength ? raw.slice(0, maxLength) : raw;
}
