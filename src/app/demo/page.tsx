import type { Metadata } from "next";
import { StructuredDataScript } from "@/components/layout/StructuredDataScript";
import { SampleRunPageClient } from "@/features/demo/components/SampleRunPageClient";
import {
  createSampleRunRouteMetadata,
  createSampleRunRouteStructuredData,
  resolveSampleRunPageModel,
  type SampleRunRoutePageProps,
} from "@/features/demo/lib/sample-run-route";

export const metadata: Metadata = createSampleRunRouteMetadata();

export default async function SampleRunPage(props: SampleRunRoutePageProps) {
  const { sampleRunId } = await resolveSampleRunPageModel(props);
  const structuredData = createSampleRunRouteStructuredData();

  return (
    <>
      <StructuredDataScript id="sample-run-structured-data" data={structuredData} />
      <SampleRunPageClient sampleRunId={sampleRunId} />
    </>
  );
}
