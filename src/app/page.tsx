import type { Metadata } from "next";
import { StructuredDataScript } from "@/components/layout/StructuredDataScript";
import { HomePageContent } from "@/features/home/components/HomePageContent";
import {
  createHomeRouteMetadata,
  createHomeRouteStructuredData,
} from "@/features/home/lib/home-route";

export const metadata: Metadata = createHomeRouteMetadata();

export default function Home() {
  const structuredData = createHomeRouteStructuredData();

  return (
    <main className="relative">
      <StructuredDataScript id="home-structured-data" data={structuredData} />
      <HomePageContent />
    </main>
  );
}
