/** Query param values accepted by `/demo?archetype=`. */
export const DEMO_ARCHETYPE_QUERY_VALUES = [
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
 * Normalize `/demo?archetype=` to a bundled reference sample id.
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function resolveDemoArchetype(value) {
  const key = String(value ?? "dashboard")
    .trim()
    .toLowerCase();
  return QUERY_TO_SAMPLE_ID[key] ?? QUERY_TO_SAMPLE_ID.dashboard;
}

/**
 * Human label for demo archetype chip / hero copy.
 * @param {string} sampleId
 */
export function demoArchetypeLabel(sampleId) {
  return SAMPLE_LABELS[sampleId] ?? SAMPLE_LABELS.dashboard;
}
