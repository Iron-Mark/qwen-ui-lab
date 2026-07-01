import type { Metadata } from "next";
import { StructuredDataScript } from "@/components/layout/StructuredDataScript";
import { SampleReferencePageClient } from "@/features/demo/components/SampleReferencePageClient";
import {
  createDemoRouteMetadata,
  createDemoRouteStructuredData,
  resolveDemoPageModel,
  type DemoRoutePageProps,
} from "@/features/demo/lib/demo-route";

export const metadata: Metadata = createDemoRouteMetadata();

export default async function DemoPage(props: DemoRoutePageProps) {
  const { sampleReferenceId } = await resolveDemoPageModel(props);
  const structuredData = createDemoRouteStructuredData();

  return (
    <>
      <StructuredDataScript data={structuredData} />
      <SampleReferencePageClient sampleReferenceId={sampleReferenceId} />
    </>
  );
}
