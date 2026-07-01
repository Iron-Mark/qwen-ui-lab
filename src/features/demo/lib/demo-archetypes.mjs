/** Query param values accepted by `/demo?archetype=`. */
export const SAMPLE_REFERENCE_QUERY_VALUES = [
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
 * Normalize `/demo?archetype=` to a sample screenshot id.
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function resolveSampleReferenceId(value) {
  const key = String(value ?? "dashboard")
    .trim()
    .toLowerCase();
  return QUERY_TO_SAMPLE_ID[key] ?? QUERY_TO_SAMPLE_ID.dashboard;
}

/**
 * Human label for sample screenshot chip / hero copy.
 * @param {string} sampleId
 */
export function sampleReferenceLabel(sampleId) {
  return SAMPLE_LABELS[sampleId] ?? SAMPLE_LABELS.dashboard;
}
