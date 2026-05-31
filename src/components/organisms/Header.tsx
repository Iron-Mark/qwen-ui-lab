"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Orbit, PanelsTopLeft } from "lucide-react";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
import { BrandThemeSwitcher } from "@/components/atoms/BrandThemeSwitcher";
import { ProviderModeBadge } from "@/components/atoms/ProviderModeBadge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-[0_6px_18px_color-mix(in_oklch,var(--primary)_35%,transparent)]">
            <Orbit className="size-5" aria-hidden />
          </div>
          <div>
            <p className="text-lg font-bold text-card-foreground">
              qwen-ui-lab
            </p>
            <p className="text-xs text-muted-foreground">
              AI UI Studio
            </p>
          </div>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3" aria-label="Main">
          <ProviderModeBadge />
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: pathname === "/" ? "secondary" : "ghost" }),
              "min-h-11 gap-2",
            )}
          >
            <LayoutDashboard className="size-4" aria-hidden />
            Dashboard
          </Link>
          <Link
            href="/design-system"
            className={cn(
              buttonVariants({
                variant: pathname.startsWith("/design-system") ? "secondary" : "ghost",
              }),
              "min-h-11 gap-2",
            )}
          >
            <PanelsTopLeft className="size-4" aria-hidden />
            Design system
          </Link>
          <BrandThemeSwitcher />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
