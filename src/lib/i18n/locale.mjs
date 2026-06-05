export const SUPPORTED_LOCALES = ["en", "zh"];
export const DEFAULT_LOCALE = "en";

/**
 * @param {string | null | undefined} input
 * @returns {"en" | "zh"}
 */
export function resolveLocale(input) {
  if (input && SUPPORTED_LOCALES.includes(input)) {
    return input;
  }
  return DEFAULT_LOCALE;
}
