/**
 * @param {string} filename
 */
export function sanitizeScaffoldFilename(filename) {
  const basename = String(filename || "starter-component.tsx")
    .trim()
    .split(/[/\\]+/)
    .pop();
  const base = String(basename || "starter-component.tsx")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!base) return "starter-component.tsx";
  if (base.endsWith(".tsx") || base.endsWith(".ts") || base.endsWith(".jsx")) {
    return base;
  }
  return `${base}.tsx`;
}
