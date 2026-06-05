import { getReferenceSampleById } from "./reference-samples.data.mjs";

/** Query param values accepted by `/demo?archetype=` */
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

/**
 * Normalize `/demo?archetype=` to a bundled reference sample id.
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function resolveDemoArchetype(value) {
  const key = String(value ?? "dashboard")
    .trim()
    .toLowerCase();
  const sampleId = QUERY_TO_SAMPLE_ID[key] ?? QUERY_TO_SAMPLE_ID.dashboard;
  return sampleId;
}

/**
 * @param {string} sampleId
 */
export function getDemoArchetypeSample(sampleId) {
  return getReferenceSampleById(sampleId);
}

/**
 * Suggested export filename for a demo archetype sample id.
 * @param {string} sampleId
 */
export function demoArchetypeExportFilename(sampleId) {
  const slug =
    sampleId === "ecommerce"
      ? "shop"
      : sampleId === "dashboard"
        ? "dashboard"
        : sampleId;
  return `generated-${slug}.tsx`;
}

/**
 * Human label for demo archetype chip / hero copy.
 * @param {string} sampleId
 */
export function demoArchetypeLabel(sampleId) {
  const sample = getReferenceSampleById(sampleId);
  return sample.label;
}
