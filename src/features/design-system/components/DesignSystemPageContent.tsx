import { Suspense } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Skeleton } from "@/components/ui/skeleton";
import { DesignSystemLcpHeader } from "./DesignSystemLcpHeader";
import { DesignSystemPreviewClient } from "./DesignSystemPreviewClient";

export function DesignSystemPageContent() {
  return (
    <PageContainer className="space-y-6 py-6">
      <Suspense
        fallback={<Skeleton className="h-28 w-full rounded-2xl" aria-hidden />}
      >
        <DesignSystemLcpHeader />
      </Suspense>
      <DesignSystemPreviewClient />
    </PageContainer>
  );
}
