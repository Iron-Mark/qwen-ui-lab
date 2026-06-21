import type { Metadata } from "next";
import { StructuredDataScript } from "@/components/layout/StructuredDataScript";
import { DemoPageClient } from "@/features/demo/components/DemoPageClient";
import {
  createDemoRouteMetadata,
  createDemoRouteStructuredData,
  resolveDemoPageModel,
  type DemoRoutePageProps,
} from "@/features/demo/lib/demo-route";

export const metadata: Metadata = createDemoRouteMetadata();

export default async function DemoPage(props: DemoRoutePageProps) {
  const { demoArchetype } = await resolveDemoPageModel(props);
  const structuredData = createDemoRouteStructuredData();

  return (
    <>
      <StructuredDataScript data={structuredData} />
      <DemoPageClient demoArchetype={demoArchetype} />
    </>
  );
}
