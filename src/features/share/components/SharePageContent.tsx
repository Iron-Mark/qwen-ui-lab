import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SharePageClient } from "./SharePageClient";
import type { buildShareableSummary } from "../lib/share-result.mjs";

type SharePageContentProps = {
  id: string;
  summary: NonNullable<ReturnType<typeof buildShareableSummary>>;
};

export function SharePageContent({ id, summary }: SharePageContentProps) {
  return (
    <Suspense
      fallback={
        <div className="py-10">
          <Skeleton className="mx-auto h-64 max-w-2xl rounded-2xl" aria-hidden />
        </div>
      }
    >
      <SharePageClient id={id} summary={summary} />
    </Suspense>
  );
}
