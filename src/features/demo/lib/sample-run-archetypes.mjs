/** Public query values accepted by the compatibility sample-run route. */
export const SAMPLE_RUN_QUERY_VALUES = [
  "dashboard",
  "auth",
  "mobile",
  "landing",
  "settings",
  "shop",
];

const QUERY_TO_SAMPLE_ID = {
  dashboard: "dashboard",
  auth: "auth",
  mobile: "mobile",
  landing: "landing",
  settings: "settings",
  shop: "ecommerce",
};

const SAMPLE_LABELS = {
  dashboard: "Dashboard",
  auth: "Sign in",
  mobile: "Mobile app",
  landing: "Landing page",
  settings: "Settings",
  ecommerce: "Shop catalog",
};

/**
 * Normalize a sample-run route value to a sample layout id.
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function resolveSampleRunId(value) {
  const key = String(value ?? "dashboard")
    .trim()
    .toLowerCase();
  return QUERY_TO_SAMPLE_ID[key] ?? QUERY_TO_SAMPLE_ID.dashboard;
}

/**
 * Human label for sample run chip / hero copy.
 * @param {string} sampleId
 */
export function sampleRunLabel(sampleId) {
  return SAMPLE_LABELS[sampleId] ?? SAMPLE_LABELS.dashboard;
}
