import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { HomeBelowFoldClient } from "./HomeBelowFoldClient";
import { HomeMarketingHero } from "./HomeMarketingHero";

export function HomePageContent() {
  return (
    <>
      <div className="relative">
        <Suspense
          fallback={
            <div className="border-b border-border/60 bg-background py-12">
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
