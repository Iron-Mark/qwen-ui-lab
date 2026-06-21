export const BRAND_THEME_VALUES = ["indigo", "emerald", "sunset"] as const;
export type BrandTheme = (typeof BRAND_THEME_VALUES)[number];
export const DEFAULT_BRAND_THEME: BrandTheme = "indigo";

export function isBrandTheme(value: string | null): value is BrandTheme {
  return BRAND_THEME_VALUES.includes(value as BrandTheme);
}

export function createThemeBootstrapScript(): string {
  return `
  (function() {
    try {
      var theme = localStorage.getItem('theme');
      var brandTheme = localStorage.getItem('brand-theme');
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
      if (${JSON.stringify(BRAND_THEME_VALUES)}.indexOf(brandTheme) !== -1) {
        document.documentElement.dataset.brand = brandTheme;
      } else {
        document.documentElement.dataset.brand = ${JSON.stringify(DEFAULT_BRAND_THEME)};
      }
    } catch (e) {}
  })();
`;
}
