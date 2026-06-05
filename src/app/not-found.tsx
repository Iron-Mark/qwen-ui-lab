import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { NotFoundClient } from "@/app/not-found-client";

export default function NotFound() {
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
