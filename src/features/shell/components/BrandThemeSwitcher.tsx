"use client";

import { Palette } from "lucide-react";
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
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BRAND_OPTIONS: Array<{ value: BrandTheme; label: string; subtitle: string }> = [
  { value: "indigo", label: "Indigo Studio", subtitle: "Default brand palette" },
  { value: "emerald", label: "Emerald Pro", subtitle: "Fresh and confident" },
  { value: "sunset", label: "Sunset Neon", subtitle: "Warm and energetic" },
];

export function BrandThemeSwitcher() {
  const { brandTheme, setBrandTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-lg" aria-label="Switch brand theme">
            <Palette className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Brand theme</DropdownMenuLabel>
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
                  <span className="text-xs text-muted-foreground">{option.subtitle}</span>
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
