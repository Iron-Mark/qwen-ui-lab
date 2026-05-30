"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
export type BrandTheme = "indigo" | "emerald" | "sunset";

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
  if (typeof window === "undefined") return "indigo";
  const stored = localStorage.getItem("brand-theme") as BrandTheme | null;
  if (stored === "indigo" || stored === "emerald" || stored === "sunset") return stored;
  return "indigo";
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
      brandTheme: "indigo" as BrandTheme,
      toggleTheme: () => {},
      setBrandTheme: () => {},
    };
  }
  return context;
}
