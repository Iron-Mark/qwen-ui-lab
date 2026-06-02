"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { LayoutDashboard, Orbit, PanelsTopLeft } from "lucide-react";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
import { BrandThemeSwitcher } from "@/components/atoms/BrandThemeSwitcher";
import { DemoModeSnackbar } from "@/components/atoms/DemoModeSnackbar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { createExperimentConfig, resolveExperimentVariant } from "@/lib/experiments";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const designSystemVariant = useMemo(() => {
    const config = createExperimentConfig(process.env);
    // Use a stable subject key so assignment remains deterministic.
    return resolveExperimentVariant("headerDesignSystemCta", "anonymous", config);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/85 backdrop-blur-md">
      <DemoModeSnackbar />
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 cursor-pointer items-center gap-3 rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-[0_6px_18px_color-mix(in_oklch,var(--primary)_35%,transparent)]">
            <Orbit className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-card-foreground">
              qwen-ui-lab
            </p>
            <p className="truncate text-xs text-muted-foreground">
              AI UI Studio
            </p>
          </div>
        </Link>
        <nav className="flex flex-1 items-center justify-center gap-1.5 sm:gap-2" aria-label="Main">
          <Link
            href="/"
            className={cn(
              buttonVariants({
                variant: pathname === "/" ? "secondary" : "ghost",
                size: "lg",
              }),
              "h-10 min-h-10 gap-2 px-3",
            )}
            aria-current={pathname === "/" ? "page" : undefined}
          >
            <LayoutDashboard className="size-4" aria-hidden />
            Dashboard
          </Link>
          <Link
            href="/design-system"
            className={cn(
              buttonVariants({
                variant: pathname.startsWith("/design-system") ? "secondary" : "ghost",
                size: "lg",
              }),
              "h-10 min-h-10 gap-2 px-3",
            )}
            aria-current={pathname.startsWith("/design-system") ? "page" : undefined}
          >
            <PanelsTopLeft className="size-4" aria-hidden />
            Design system
            {designSystemVariant === "with-labs-badge" ? (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] uppercase">
                Labs
              </Badge>
            ) : null}
          </Link>
        </nav>
        <div className="flex items-center justify-end gap-2">
          <BrandThemeSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
