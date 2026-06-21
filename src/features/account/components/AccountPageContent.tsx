import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountPageClient } from "./AccountPageClient";

export function AccountPageContent() {
  return (
    <Suspense
      fallback={
        <div className="py-10">
          <Skeleton className="mx-auto h-96 max-w-2xl rounded-2xl" aria-hidden />
        </div>
      }
    >
      <AccountPageClient />
    </Suspense>
  );
}
