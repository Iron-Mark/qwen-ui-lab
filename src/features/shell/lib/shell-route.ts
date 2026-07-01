import type { Metadata } from "next";
import { createRouteMetadata } from "@/lib/seo";

export function createNotFoundRouteMetadata(): Metadata {
  return createRouteMetadata({
    title: "Page not found",
    description:
      "The requested qwen-ui-lab page does not exist or may have moved. Return to the workflow or design system.",
    path: "/404",
  });
}
