"use client";

import { Palette } from "lucide-react";
import { useTheme, type BrandTheme } from "@/components/providers/ThemeProvider";
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
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.subtitle}</span>
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
