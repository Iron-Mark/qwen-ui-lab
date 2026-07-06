"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  BRAND_THEME_COOKIE_NAME,
  BRAND_THEME_STORAGE_KEY,
  DEFAULT_BRAND_THEME,
  DEFAULT_THEME,
  THEME_COOKIE_NAME,
  THEME_STORAGE_KEY,
  createPreferenceCookie,
  isTheme,
  readPreferenceCookie,
  resolveBrandTheme,
  type BrandTheme,
  type Theme,
} from "@/lib/theme-preferences";

export type { BrandTheme } from "@/lib/theme-preferences";

/** Light-mode `--primary` from globals.css per brand (dropdown swatches). */
export const BRAND_THEME_SWATCH: Record<BrandTheme, string> = {
  purple: "oklch(0.53 0.24 293)",
  blue: "oklch(0.55 0.22 263)",
  sunset: "oklch(0.68 0.19 28)",
};

interface ThemeContextType {
  theme: Theme;
  brandTheme: BrandTheme;
  toggleTheme: () => void;
  setBrandTheme: (theme: BrandTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function readLocalPreference(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalPreference(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Persistence is nice-to-have; the in-memory theme state still updates.
  }
}

function readCookiePreference(name: string): string | null {
  try {
    return readPreferenceCookie(document.cookie, name);
  } catch {
    return null;
  }
}

function writeCookiePreference(name: string, value: string) {
  try {
    document.cookie = createPreferenceCookie(name, value);
  } catch {
    // Cookie persistence is optional in locked-down browser contexts.
  }
}

function getSystemThemePreference(): Theme {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return DEFAULT_THEME;
  }
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = readLocalPreference(THEME_STORAGE_KEY);
  if (isTheme(stored)) return stored;
  const cookieTheme = readCookiePreference(THEME_COOKIE_NAME);
  if (isTheme(cookieTheme)) return cookieTheme;
  return getSystemThemePreference();
}

function getInitialBrandTheme(): BrandTheme {
  if (typeof window === "undefined") return DEFAULT_BRAND_THEME;
  const stored = readLocalPreference(BRAND_THEME_STORAGE_KEY);
  if (stored) return resolveBrandTheme(stored);
  const cookieBrandTheme = readCookiePreference(BRAND_THEME_COOKIE_NAME);
  if (cookieBrandTheme) return resolveBrandTheme(cookieBrandTheme);
  return DEFAULT_BRAND_THEME;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [brandTheme, setBrandThemeState] = useState<BrandTheme>(getInitialBrandTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    writeLocalPreference(THEME_STORAGE_KEY, theme);
    writeCookiePreference(THEME_COOKIE_NAME, theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.brand = brandTheme;
    writeLocalPreference(BRAND_THEME_STORAGE_KEY, brandTheme);
    writeCookiePreference(BRAND_THEME_COOKIE_NAME, brandTheme);
  }, [brandTheme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const setBrandTheme = useCallback((nextTheme: BrandTheme) => {
    setBrandThemeState(nextTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, brandTheme, toggleTheme, setBrandTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: "light" as Theme,
      brandTheme: DEFAULT_BRAND_THEME,
      toggleTheme: () => {},
      setBrandTheme: () => {},
    };
  }
  return context;
}
