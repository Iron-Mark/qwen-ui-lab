import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { NotFoundClient } from "./NotFoundClient";

export function NotFoundContent() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Skeleton className="h-48 w-full max-w-md rounded-2xl" aria-hidden />
        </div>
      }
    >
      <NotFoundClient />
    </Suspense>
  );
}
