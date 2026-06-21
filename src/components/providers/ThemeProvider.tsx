"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  DEFAULT_BRAND_THEME,
  isBrandTheme,
  type BrandTheme,
} from "@/lib/theme-bootstrap.client";

type Theme = "light" | "dark";
export type { BrandTheme } from "@/lib/theme-bootstrap.client";

/** Light-mode `--primary` from globals.css per brand (dropdown swatches). */
export const BRAND_THEME_SWATCH: Record<BrandTheme, string> = {
  indigo: "oklch(0.54 0.2 259)",
  emerald: "oklch(0.66 0.16 165)",
  sunset: "oklch(0.68 0.19 28)",
};

interface ThemeContextType {
  theme: Theme;
  brandTheme: BrandTheme;
  toggleTheme: () => void;
  setBrandTheme: (theme: BrandTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("theme") as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialBrandTheme(): BrandTheme {
  if (typeof window === "undefined") return DEFAULT_BRAND_THEME;
  const stored = localStorage.getItem("brand-theme");
  if (isBrandTheme(stored)) return stored;
  return DEFAULT_BRAND_THEME;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [brandTheme, setBrandThemeState] = useState<BrandTheme>(getInitialBrandTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.brand = brandTheme;
    localStorage.setItem("brand-theme", brandTheme);
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
