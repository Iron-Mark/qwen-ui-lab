"use client";

import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { useObservability } from "./ObservabilityProvider";
import { useProviderMode } from "./ProviderModeProvider";

type ErrorBoundaryProps = ComponentProps<typeof ErrorBoundary>;

export function ObservabilityErrorBoundary(props: ErrorBoundaryProps) {
  const pathname = usePathname();
  const observability = useObservability();
  const { mode } = useProviderMode();

  const onCaptureError = (error: Error) => {
    observability?.captureError(error, {
      source: "error_boundary",
      route: pathname,
      providerMode: mode,
    });
  };

  return <ErrorBoundary {...props} onCaptureError={onCaptureError} />;
}
