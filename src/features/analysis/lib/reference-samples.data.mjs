/** Sample screenshots for the compatibility sample route and E2E (client-safe). */
export const BUNDLED_REFERENCE_SAMPLES = [
  {
    id: "dashboard",
    label: "Dashboard",
    fileName: "dashboard-reference.png",
    path: "/references/dashboard-reference.png",
    webpPath: "/references/dashboard-reference.webp",
    mimeType: "image/png",
    width: 1440,
    height: 900,
    hint: "Cards, charts, activity feeds, and quick actions.",
  },
  {
    id: "auth",
    label: "Sign in",
    fileName: "auth-reference.png",
    path: "/references/auth-reference.png",
    webpPath: "/references/auth-reference.webp",
    mimeType: "image/png",
    width: 1200,
    height: 720,
    hint: "Auth cards, form fields, and recovery links.",
  },
  {
    id: "mobile",
    label: "Mobile app",
    fileName: "mobile-reference.png",
    path: "/references/mobile-reference.png",
    webpPath: "/references/mobile-reference.webp",
    mimeType: "image/png",
    width: 390,
    height: 844,
    hint: "Phone layouts, bottom navigation, and compact content.",
  },
  {
    id: "landing",
    label: "Landing page",
    fileName: "landing-reference.png",
    path: "/references/landing-reference.png",
    webpPath: "/references/landing-reference.webp",
    mimeType: "image/png",
    width: 1440,
    height: 900,
    hint: "Hero sections, pricing, and marketing CTAs.",
  },
  {
    id: "settings",
    label: "Settings",
    fileName: "settings-reference.png",
    path: "/references/settings-reference.png",
    webpPath: "/references/settings-reference.webp",
    mimeType: "image/png",
    width: 1200,
    height: 720,
    hint: "Profile forms, toggles, and preference panels.",
  },
  {
    id: "ecommerce",
    label: "Shop catalog",
    fileName: "ecommerce-reference.png",
    path: "/references/ecommerce-reference.png",
    webpPath: "/references/ecommerce-reference.webp",
    mimeType: "image/png",
    width: 1200,
    height: 720,
    hint: "Filters, product grids, and catalog actions.",
  },
  {
    id: "stress-dashboard",
    label: "Dense dashboard",
    fileName: "stress-dashboard-reference.png",
    path: "/references/stress-dashboard-reference.png",
    webpPath: "/references/stress-dashboard-reference.webp",
    mimeType: "image/png",
    width: 1440,
    height: 900,
    hint: "Dense metrics, tables, and admin tools.",
  },
  {
    id: "stress-list",
    label: "Repeated list",
    fileName: "stress-list-reference.png",
    path: "/references/stress-list-reference.png",
    webpPath: "/references/stress-list-reference.webp",
    mimeType: "image/png",
    width: 1200,
    height: 720,
    hint: "Repeated rows, item actions, and list rhythm.",
  },
];

/** Archetypes shipped as PNG + WebP rasters (SVG sources kept for regeneration). */
export const RASTER_REFERENCE_STEMS = [
  "dashboard-reference",
  "auth-reference",
  "mobile-reference",
  "landing-reference",
  "settings-reference",
  "ecommerce-reference",
  "stress-dashboard-reference",
  "stress-list-reference",
];

/** Default sample for E2E fixtures and backward-compatible helpers. */
export const DEFAULT_REFERENCE_SAMPLE = BUNDLED_REFERENCE_SAMPLES[0];

/**
 * @param {string} fileName
 */
export function inferReferenceMimeType(fileName) {
  const ext = String(fileName || "").split(".").pop()?.toLowerCase() ?? "";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return "image/svg+xml";
}

/**
 * @param {string} fileName
 */
export function getReferenceSampleStem(fileName) {
  const key = String(fileName || "").split(/[/\\]/).pop()?.toLowerCase() ?? "";
  return key.replace(/\.(png|jpe?g|webp|svg)$/i, "");
}

/**
 * @param {string} fileName
 */
export function getReferenceSampleByFileName(fileName) {
  return findReferenceSampleByFileName(fileName) ?? DEFAULT_REFERENCE_SAMPLE;
}

/**
 * @param {string} fileName
 */
export function findReferenceSampleByFileName(fileName) {
  const key = String(fileName || "").split(/[/\\]/).pop()?.toLowerCase() ?? "";
  const direct = BUNDLED_REFERENCE_SAMPLES.find((sample) => sample.fileName === key);
  if (direct) return direct;

  const stem = getReferenceSampleStem(key);
  return BUNDLED_REFERENCE_SAMPLES.find(
    (sample) => getReferenceSampleStem(sample.fileName) === stem,
  );
}

/**
 * @param {string} id
 */
export function getReferenceSampleById(id) {
  return (
    BUNDLED_REFERENCE_SAMPLES.find((sample) => sample.id === id) ??
    DEFAULT_REFERENCE_SAMPLE
  );
}

/**
 * Suggested export filename for a sample screenshot id.
 * @param {string} sampleId
 */
export function referenceSampleExportFilename(sampleId) {
  const sample = getReferenceSampleById(sampleId);
  const slug = sample.id === "ecommerce" ? "shop" : sample.id;
  return `generated-${slug}.tsx`;
}
