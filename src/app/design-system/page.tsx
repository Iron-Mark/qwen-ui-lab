import type { Metadata } from "next";
import { StructuredDataScript } from "@/components/layout/StructuredDataScript";
import { DesignSystemPageContent } from "@/features/design-system/components/DesignSystemPageContent";
import {
  createDesignSystemRouteMetadata,
  createDesignSystemRouteStructuredData,
} from "@/features/design-system/lib/design-system-route";

export const metadata: Metadata = createDesignSystemRouteMetadata();

export default function DesignSystemPage() {
  const structuredData = createDesignSystemRouteStructuredData();

  return (
    <>
      <StructuredDataScript data={structuredData} />
      <DesignSystemPageContent />
    </>
  );
}
