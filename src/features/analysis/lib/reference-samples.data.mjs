/** Bundled meetup reference screenshots for offline demo + E2E (client-safe). */
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
    hint: "PNG screenshot · Admin analytics shell",
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
    hint: "PNG screenshot · Centered auth card",
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
    hint: "PNG screenshot · Phone shell + bottom nav",
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
    hint: "PNG screenshot · Marketing hero + pricing",
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
    hint: "PNG screenshot · Profile + toggles",
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
    hint: "PNG screenshot · Filters + product grid",
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
  const key = String(fileName || "").split(/[/\\]/).pop()?.toLowerCase() ?? "";
  const direct = BUNDLED_REFERENCE_SAMPLES.find((sample) => sample.fileName === key);
  if (direct) return direct;

  const stem = getReferenceSampleStem(key);
  return (
    BUNDLED_REFERENCE_SAMPLES.find(
      (sample) => getReferenceSampleStem(sample.fileName) === stem,
    ) ?? DEFAULT_REFERENCE_SAMPLE
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
