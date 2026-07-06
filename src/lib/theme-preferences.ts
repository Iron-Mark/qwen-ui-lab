export const BRAND_THEME_VALUES = ["purple", "blue", "sunset"] as const;
export type BrandTheme = (typeof BRAND_THEME_VALUES)[number];
export const DEFAULT_BRAND_THEME: BrandTheme = "purple";
export const THEME_VALUES = ["light", "dark"] as const;
export type Theme = (typeof THEME_VALUES)[number];
export const DEFAULT_THEME: Theme = "light";
export const THEME_STORAGE_KEY = "theme";
export const BRAND_THEME_STORAGE_KEY = "brand-theme";
export const THEME_COOKIE_NAME = "qwen-ui-theme";
export const BRAND_THEME_COOKIE_NAME = "qwen-ui-brand";
export const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function isBrandTheme(value: string | null): value is BrandTheme {
  return BRAND_THEME_VALUES.includes(value as BrandTheme);
}

const LEGACY_BRAND_THEME_ALIASES = {
  indigo: "purple",
  emerald: "blue",
} as const satisfies Record<string, BrandTheme>;

export function isTheme(value: string | null): value is Theme {
  return THEME_VALUES.includes(value as Theme);
}

export function resolveTheme(value: string | null | undefined): Theme {
  const candidate = value ?? null;
  return isTheme(candidate) ? candidate : DEFAULT_THEME;
}

export function resolveBrandTheme(value: string | null | undefined): BrandTheme {
  const candidate = value ?? null;
  if (isBrandTheme(candidate)) return candidate;
  if (candidate && candidate in LEGACY_BRAND_THEME_ALIASES) {
    return LEGACY_BRAND_THEME_ALIASES[candidate as keyof typeof LEGACY_BRAND_THEME_ALIASES];
  }
  return DEFAULT_BRAND_THEME;
}

export function createPreferenceCookie(name: string, value: string): string {
  return [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${THEME_COOKIE_MAX_AGE_SECONDS}`,
    "SameSite=Lax",
  ].join("; ");
}

export function readPreferenceCookie(cookieHeader: string, name: string): string | null {
  const prefix = `${name}=`;
  const rawPair = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (!rawPair) return null;

  try {
    return decodeURIComponent(rawPair.slice(prefix.length));
  } catch {
    return null;
  }
}
