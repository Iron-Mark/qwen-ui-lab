"use client";

import { useEffect, useState } from "react";
import { MonitorCog, Moon, Palette, Sun } from "lucide-react";
import {
  BRAND_THEME_SWATCH,
  useTheme,
  type BrandTheme,
} from "@/components/providers/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BRAND_OPTIONS: Array<{ value: BrandTheme; label: string; subtitle: string }> = [
  { value: "indigo", label: "Indigo Studio", subtitle: "Default brand palette" },
  { value: "emerald", label: "Emerald Pro", subtitle: "Fresh and confident" },
  { value: "sunset", label: "Sunset Neon", subtitle: "Warm and energetic" },
];

export function AppearanceMenu() {
  const [mounted, setMounted] = useState(false);
  const { theme, brandTheme, setBrandTheme, toggleTheme } = useTheme();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label="Appearance settings"
        disabled
      >
        <MonitorCog className="size-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-lg" aria-label="Appearance settings">
            {theme === "light" ? (
              <Sun className="size-4" aria-hidden />
            ) : (
              <Moon className="size-4" aria-hidden />
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2">
            <Palette className="size-3.5" aria-hidden />
            Brand theme
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={brandTheme}
            onValueChange={(value) => setBrandTheme(value as BrandTheme)}
          >
            {BRAND_OPTIONS.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className="pr-14"
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span>{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.subtitle}
                  </span>
                </div>
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 right-8 size-4 shrink-0 -translate-y-1/2 rounded-md ring-1 ring-foreground/15"
                  style={{ backgroundColor: BRAND_THEME_SWATCH[option.value] }}
                />
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={toggleTheme}
          className="min-h-9 cursor-pointer justify-between"
        >
          <span className="flex items-center gap-2">
            {theme === "light" ? (
              <Moon className="size-4" aria-hidden />
            ) : (
              <Sun className="size-4" aria-hidden />
            )}
            {theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
