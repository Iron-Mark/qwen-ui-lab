import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { HomeBelowFoldClient } from "./HomeBelowFoldClient";
import { HomeMarketingHero } from "./HomeMarketingHero";

export function HomePageContent() {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(circle_at_top,oklch(0.97_0_0),transparent_65%)] dark:bg-[radial-gradient(circle_at_top,oklch(0.26_0_0),transparent_65%)]" />
      <div className="relative">
        <Suspense
          fallback={
            <div className="border-b border-border/60 bg-card/30 py-12">
              <Skeleton className="mx-auto h-40 max-w-3xl" />
            </div>
          }
        >
          <HomeMarketingHero />
        </Suspense>
        <HomeBelowFoldClient />
      </div>
    </>
  );
}
