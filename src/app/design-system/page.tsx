import { Suspense } from "react";
import type { Metadata } from "next";
import { DesignSystemPreview } from "@/components/design-system/DesignSystemPreview";

export const metadata: Metadata = {
  title: "Design System",
  description:
    "Atomic design catalog with copy/export controls and snippet previews.",
  alternates: {
    canonical: "/design-system",
  },
  openGraph: {
    title: "qwen-ui-lab Design System",
    description:
      "Browse atomic components with previews, snippets, and UX-law references in qwen-ui-lab.",
    url: "/design-system",
  },
  twitter: {
    title: "qwen-ui-lab Design System",
    description:
      "Browse atomic components with previews, snippets, and UX-law references in qwen-ui-lab.",
  },
};

function DesignSystemFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground">
      Loading design system…
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <Suspense fallback={<DesignSystemFallback />}>
      <DesignSystemPreview />
    </Suspense>
  );
}
