/** Bundled meetup reference screenshots for offline demo + E2E (client-safe). */
export const BUNDLED_REFERENCE_SAMPLES = [
  {
    id: "dashboard",
    label: "Dashboard",
    fileName: "dashboard-reference.svg",
    path: "/references/dashboard-reference.svg",
    width: 1440,
    height: 900,
    hint: "Admin analytics shell",
  },
  {
    id: "auth",
    label: "Sign in",
    fileName: "auth-reference.svg",
    path: "/references/auth-reference.svg",
    width: 1200,
    height: 720,
    hint: "Centered auth card",
  },
  {
    id: "mobile",
    label: "Mobile app",
    fileName: "mobile-reference.svg",
    path: "/references/mobile-reference.svg",
    width: 390,
    height: 844,
    hint: "Phone shell + bottom nav",
  },
  {
    id: "landing",
    label: "Landing page",
    fileName: "landing-reference.svg",
    path: "/references/landing-reference.svg",
    width: 1440,
    height: 900,
    hint: "Marketing hero + pricing",
  },
  {
    id: "settings",
    label: "Settings",
    fileName: "settings-reference.svg",
    path: "/references/settings-reference.svg",
    width: 1200,
    height: 720,
    hint: "Profile + toggles",
  },
  {
    id: "ecommerce",
    label: "Shop catalog",
    fileName: "ecommerce-reference.svg",
    path: "/references/ecommerce-reference.svg",
    width: 1200,
    height: 720,
    hint: "Filters + product grid",
  },
];

/** Default sample for E2E fixtures and backward-compatible helpers. */
export const DEFAULT_REFERENCE_SAMPLE = BUNDLED_REFERENCE_SAMPLES[0];

/**
 * @param {string} fileName
 */
export function getReferenceSampleByFileName(fileName) {
  const key = String(fileName || "").split(/[/\\]/).pop()?.toLowerCase() ?? "";
  return (
    BUNDLED_REFERENCE_SAMPLES.find((sample) => sample.fileName === key) ??
    DEFAULT_REFERENCE_SAMPLE
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
