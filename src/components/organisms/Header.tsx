"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { LayoutDashboard, PanelsTopLeft } from "lucide-react";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { createExperimentConfig, resolveExperimentVariant } from "@/lib/experiments";
import { localizedHref, useLocale } from "@/lib/i18n";
import { PageContainer } from "@/components/layout/PageContainer";
import { cn } from "@/lib/utils";

const BrandThemeSwitcher = dynamic(
  () =>
    import("@/components/atoms/BrandThemeSwitcher").then(
      (mod) => mod.BrandThemeSwitcher,
    ),
  { ssr: false },
);

const DemoModeSnackbar = dynamic(
  () =>
    import("@/components/atoms/DemoModeSnackbar").then((mod) => mod.DemoModeSnackbar),
  { ssr: false },
);

export function Header() {
  const pathname = usePathname();
  const { locale, dict } = useLocale();
  const t = dict.header;
  const designSystemVariant = useMemo(() => {
    const config = createExperimentConfig(process.env);
    return resolveExperimentVariant("headerDesignSystemCta", "anonymous", config);
  }, []);

  return (
    <header lang={locale} className="sticky top-0 z-40 border-b border-border/80 bg-card/85 backdrop-blur-md">
      <DemoModeSnackbar />
      <PageContainer className="flex h-16 items-center gap-4">
        <Link
          href={localizedHref("/", locale)}
          className="flex min-w-0 cursor-pointer items-center gap-3 rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Image
            src="/icons/icon.svg"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-xl shadow-[0_6px_18px_color-mix(in_oklch,var(--primary)_35%,transparent)]"
            fetchPriority="low"
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-card-foreground">{t.siteTitle}</p>
            <p className="truncate text-xs text-muted-foreground">{t.siteTagline}</p>
          </div>
        </Link>
        <nav
          className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto overscroll-x-contain sm:gap-2"
          aria-label={t.navMainAria}
        >
          <Link
            href={localizedHref("/", locale)}
            aria-label={t.navDashboardAria}
            className={cn(
              buttonVariants({
                variant: pathname === "/" ? "secondary" : "ghost",
                size: "lg",
              }),
              "h-11 min-h-11 shrink-0 gap-1.5 px-2.5 sm:gap-2 sm:px-3",
            )}
            aria-current={pathname === "/" ? "page" : undefined}
          >
            <LayoutDashboard className="size-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{t.navDashboard}</span>
          </Link>
          <Link
            href={localizedHref("/design-system", locale)}
            aria-label={t.navDesignSystemAria}
            className={cn(
              buttonVariants({
                variant: pathname.startsWith("/design-system") ? "secondary" : "ghost",
                size: "lg",
              }),
              "h-11 min-h-11 shrink-0 gap-1.5 px-2.5 sm:gap-2 sm:px-3",
            )}
            aria-current={pathname.startsWith("/design-system") ? "page" : undefined}
          >
            <PanelsTopLeft className="size-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{t.navDesignSystem}</span>
            {designSystemVariant === "with-labs-badge" ? (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] uppercase">
                {t.labsBadge}
              </Badge>
            ) : null}
          </Link>
        </nav>
        <div className="flex items-center justify-end gap-2">
          <BrandThemeSwitcher />
          <ThemeToggle />
        </div>
      </PageContainer>
    </header>
  );
}
