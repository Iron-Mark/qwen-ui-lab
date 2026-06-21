"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import Image from "next/image";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import {
  Bug,
  ChevronRight,
  Check,
  Download,
  Eye,
  EyeOff,
  Grid2X2,
  PackageOpen,
  Redo2,
  RotateCcw,
  Share2,
  Sparkles,
  Undo2,
  UploadCloud,
  X,
} from "lucide-react";
import { ExportButton } from "@/features/export/components/ExportButton";
import { GistExportButton } from "@/features/export/components/GistExportButton";
import { RepoExportButton } from "@/features/export/components/RepoExportButton";
import { SharedSummaryCard } from "@/features/share/components/SharedSummaryCard";
import { UploadDropzone } from "./UploadDropzone";
import { useToast } from "@/components/providers/Toast";
import { useAccountIdentity } from "@/features/account/components/useAccountIdentity";
import {
  loadSessionHistory,
  saveSession,
  removeSession,
  type SessionRecord,
} from "../lib/session-history.client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { downloadTextFile } from "@/lib/clipboard.client";
import { useObservability } from "@/components/providers/ObservabilityProvider";
import { useProviderMode } from "@/components/providers/ProviderModeProvider";
import {
  buildAnalyzeFailureError,
  isReportableAnalyzeFailure,
} from "../lib/analyze-observability.mjs";
import { AnalyticsEvent, createAnalyticsClient } from "@/lib/analytics.client";
import { createExperimentConfig, resolveExperimentVariant } from "@/lib/experiments";
import {
  BUNDLED_REFERENCE_SAMPLES,
  getReferenceSampleByFileName,
  getReferenceSampleById,
  referenceSampleExportFilename,
} from "../lib/reference-samples.mjs";
import {
  formatUploadSize,
  MAX_UPLOAD_BYTES,
  validateUploadImageFile,
} from "../lib/upload-constraints.mjs";
import {
  buildShareableSummary,
  buildShareUrl,
  createShortShareLink,
  encodeShareHash,
} from "@/features/share/lib/share-result.mjs";
import {
  persistShareSummary,
  readShareFromLocation,
  readShareFromSession,
} from "@/features/share/lib/share-result.client";
import {
  getAnalyzeProgressPercent,
  getAnalyzeStepLabels,
  getFlowStepLabels,
  interpolate,
  resolveAnalyzeStepIndex,
  translateAnalyzeStep,
  type UploadFlowDictionary,
} from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale.client";

interface UiFlowArtifact {
  file: {
    name: string;
    type: string;
    size: number;
    readableSize: string;
    width?: number | null;
    height?: number | null;
  };
  steps: Array<{ id: string; label: string }>;
  plan: Array<{ title: string; body: string }>;
  previewStats: Array<{ label: string; value: string }>;
  generatedCode: string;
  modeLabel?: string;
  summary?: string;
  detections?: {
    source?: { width?: number | null; height?: number | null };
    designTokens?: DetectionDesignTokens | null;
    elements: DetectionElement[];
    layoutTree: unknown;
    quality: DetectionQuality | null;
  };
}

type DetectionElement = {
  id: string;
  kind: string;
  primitive?: string;
  confidence: number;
  included?: boolean;
  userEdited?: boolean;
  reasons?: DetectionReason[];
  box: { x: number; y: number; width: number; height: number };
};

type DetectionReason = {
  code: string;
  label: string;
  evidence: string;
  weight: number;
};

type DetectionDesignTokens = {
  surface?: string;
  foreground?: string;
  accent?: string;
  accentForeground?: string;
  muted?: string;
  border?: string;
  spacing?: string;
  radius?: string;
};

type DetectionQuality = {
  confidence?: number;
  ambiguity?: string;
  elementCount?: number;
  strategy?: string;
};

type DetectionChangeOptions = {
  recordHistory?: boolean;
};

type Stage = "empty" | "uploaded" | "analyzed" | "generated";
type ProviderState = "idle" | "loading" | "qwen" | "fallback" | "error";

const SAMPLE_USED_STORAGE_KEY = "qwen-ui-lab:upload-sample-used";

function readSampleUsedFromSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SAMPLE_USED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function persistSampleUsedInSession() {
  try {
    sessionStorage.setItem(SAMPLE_USED_STORAGE_KEY, "1");
  } catch {
    // sessionStorage may be unavailable (private mode, quota, etc.)
  }
}

type AnalyzeModules = {
  postAnalyzeUi: typeof import("../lib/analyze-outcome.mjs").postAnalyzeUi;
  preprocessImageDataUrl: typeof import("../lib/image-preprocess.client.mjs").preprocessImageDataUrl;
};

let analyzeModulesPromise: Promise<AnalyzeModules> | null = null;

function loadAnalyzeModules() {
  analyzeModulesPromise ??= Promise.all([
    import("../lib/analyze-outcome.mjs"),
    import("../lib/image-preprocess.client.mjs"),
  ]).then(([analyze, preprocess]) => ({
    postAnalyzeUi: analyze.postAnalyzeUi,
    preprocessImageDataUrl: preprocess.preprocessImageDataUrl,
  }));
  return analyzeModulesPromise;
}

const ANALYZE_STEPS_EN = [
  "Reading image…",
  "Preprocessing image…",
  "Checking provider…",
  "Analyzing layout…",
  "Building artifact…",
] as const;

const DETECTION_KIND_OPTIONS = [
  "header",
  "side-nav",
  "bottom-nav",
  "button-or-input",
  "input-or-button-row",
  "card-or-panel",
  "chart-or-media",
  "text-row",
  "control",
  "content-block",
] as const;

type SampleId = keyof UploadFlowDictionary["samples"];

function sampleCopy(
  sampleId: string,
  copy: UploadFlowDictionary,
): { label: string; hint: string } {
  const samples = copy.samples;
  if (sampleId in samples) {
    return samples[sampleId as SampleId];
  }
  return { label: sampleId, hint: "" };
}

const SnippetPreview = dynamic(
  () =>
    import("./SnippetPreview").then((mod) => ({
      default: mod.SnippetPreview,
    })),
  {
    loading: () => <Skeleton className="h-72 w-full" />,
  },
);

const UiLawsCompliance = dynamic(
  () =>
    import("./UiLawsCompliance").then((mod) => ({
      default: mod.UiLawsCompliance,
    })),
  {
    loading: () => <Skeleton className="h-32 w-full" />,
  },
);

type DetectedReferencePreviewProps = {
  previewUrl: string;
  alt: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
  detections?: UiFlowArtifact["detections"];
  copy: UploadFlowDictionary;
  canUndoDetections?: boolean;
  canRedoDetections?: boolean;
  onDetectionsChange?: (
    detections: UiFlowArtifact["detections"],
    options?: DetectionChangeOptions,
  ) => void;
  onResetDetections?: () => void;
  onUndoDetections?: () => void;
  onRedoDetections?: () => void;
  onSnapDetections?: () => void;
  onExportDetections?: () => void;
};

function DetectedReferencePreview({
  previewUrl,
  alt,
  imageWidth,
  imageHeight,
  detections,
  copy,
  canUndoDetections = false,
  canRedoDetections = false,
  onDetectionsChange,
  onResetDetections,
  onUndoDetections,
  onRedoDetections,
  onSnapDetections,
  onExportDetections,
}: DetectedReferencePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [rasterVisualScore, setRasterVisualScore] = useState<number | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const elements = useMemo(() => detections?.elements ?? [], [detections?.elements]);
  const activeElements = useMemo(
    () => elements.filter((element) => element.included !== false),
    [elements],
  );
  const selectedElement =
    elements.find((element) => element.id === selectedElementId) ?? activeElements[0] ?? null;
  const canShowOverlay = elements.length > 0 && Boolean(imageWidth && imageHeight);
  const qualityStats = buildDetectionQualityStats(
    elements,
    detections?.quality,
    canShowOverlay ? rasterVisualScore : null,
  );

  useEffect(() => {
    const observedNode = containerRef.current;
    if (!observedNode) return;
    const node = observedNode;

    function updateSize() {
      setContainerSize({
        width: node.clientWidth,
        height: node.clientHeight,
      });
    }

    updateSize();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!canShowOverlay || !previewUrl || !imageWidth || !imageHeight) {
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      setRasterVisualScore(null);
      void estimateRasterVisualMatchScore({
        previewUrl,
        elements,
        sourceWidth: imageWidth,
        sourceHeight: imageHeight,
        tokens: detections?.designTokens,
      }).then((score) => {
        if (active) {
          setRasterVisualScore(score);
        }
      });
    }, 120);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [
    canShowOverlay,
    detections?.designTokens,
    elements,
    imageHeight,
    imageWidth,
    previewUrl,
  ]);

  const imageRect = useMemo(
    () =>
      calculateObjectContainRect({
        containerWidth: containerSize.width,
        containerHeight: containerSize.height,
        imageWidth: imageWidth ?? 0,
        imageHeight: imageHeight ?? 0,
      }),
    [containerSize.height, containerSize.width, imageHeight, imageWidth],
  );
  const confidencePercent =
    typeof detections?.quality?.confidence === "number"
      ? `${Math.round(detections.quality.confidence * 100)}%`
      : null;

  function updateElement(
    elementId: string,
    patch: Partial<DetectionElement>,
    options?: DetectionChangeOptions,
  ) {
    if (!detections || !onDetectionsChange) return;
    onDetectionsChange({
      ...detections,
      elements: elements.map((element) =>
        element.id === elementId
          ? {
              ...element,
              ...patch,
              userEdited: true,
              primitive:
                patch.primitive ??
                (patch.kind
                  ? primitiveForKind(patch.kind)
                  : element.primitive ?? primitiveForKind(element.kind)),
            }
          : element,
      ),
      quality: {
        ...(detections.quality ?? {}),
        elementCount: elements.filter((element) =>
          element.id === elementId
            ? (patch.included ?? element.included ?? true) !== false
            : element.included !== false,
        ).length,
      },
    }, options);
  }

  function startBoxInteraction(
    event: ReactPointerEvent,
    element: DetectionElement,
    mode: "move" | "resize",
  ) {
    if (!imageRect || !imageWidth || !imageHeight) return;
    const activeImageRect = imageRect;
    const sourceImageWidth = imageWidth;
    const sourceImageHeight = imageHeight;
    event.preventDefault();
    event.stopPropagation();
    setSelectedElementId(element.id);

    const startClientX = event.clientX;
    const startClientY = event.clientY;
    const originalBox = { ...element.box };
    let latestBox = originalBox;
    let moved = false;

    function nextBox(clientX: number, clientY: number) {
      const deltaX =
        ((clientX - startClientX) / activeImageRect.width) * sourceImageWidth;
      const deltaY =
        ((clientY - startClientY) / activeImageRect.height) * sourceImageHeight;
      if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
        moved = true;
      }

      if (mode === "resize") {
        return clampDetectionBox(
          {
            ...originalBox,
            width: originalBox.width + deltaX,
            height: originalBox.height + deltaY,
          },
          sourceImageWidth,
          sourceImageHeight,
        );
      }

      return clampDetectionBox(
        {
          ...originalBox,
          x: originalBox.x + deltaX,
          y: originalBox.y + deltaY,
        },
        sourceImageWidth,
        sourceImageHeight,
      );
    }

    function handleMove(moveEvent: PointerEvent) {
      latestBox = nextBox(moveEvent.clientX, moveEvent.clientY);
      updateElement(element.id, { box: latestBox }, { recordHistory: false });
    }

    function handleUp(upEvent: PointerEvent) {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      latestBox = nextBox(upEvent.clientX, upEvent.clientY);
      if (moved) {
        updateElement(element.id, { box: latestBox }, { recordHistory: true });
      }
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }

  function handleDetectionBoxKeyDown(
    event: ReactKeyboardEvent,
    element: DetectionElement,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedElementId(element.id);
      return;
    }

    if (!imageWidth || !imageHeight) return;
    const arrowDeltas: Record<string, { x: number; y: number }> = {
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      ArrowUp: { x: 0, y: -1 },
    };
    const delta = arrowDeltas[event.key];
    if (!delta) return;

    event.preventDefault();
    event.stopPropagation();
    setSelectedElementId(element.id);
    const step = event.shiftKey ? 16 : 4;
    const box = event.altKey
      ? {
          ...element.box,
          width: element.box.width + delta.x * step,
          height: element.box.height + delta.y * step,
        }
      : {
          ...element.box,
          x: element.box.x + delta.x * step,
          y: element.box.y + delta.y * step,
        };
    updateElement(
      element.id,
      { box: clampDetectionBox(box, imageWidth, imageHeight) },
      { recordHistory: true },
    );
  }

  return (
    <div className="space-y-2">
      {canShowOverlay ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" data-testid="detection-overlay-count">
              {activeElements.length} active / {elements.length} detected
            </Badge>
            {confidencePercent ? (
              <span className="text-xs text-muted-foreground">
                {confidencePercent} confidence
                {detections?.quality?.ambiguity
                  ? ` · ${detections.quality.ambiguity} ambiguity`
                  : ""}
              </span>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setOverlayEnabled((value) => !value)}
            aria-pressed={overlayEnabled}
            data-testid="toggle-detection-overlay"
          >
            {overlayEnabled ? (
              <EyeOff className="size-3.5" aria-hidden />
            ) : (
              <Eye className="size-3.5" aria-hidden />
            )}
            {overlayEnabled ? "Hide detections" : "Show detections"}
          </Button>
        </div>
      ) : null}

      <div
        ref={containerRef}
        className="relative h-96 w-full overflow-hidden rounded-md border border-border"
      >
        <Image
          src={previewUrl}
          alt={alt}
          className="object-contain"
          fill
          sizes="(max-width: 1024px) 100vw, 880px"
          loading="lazy"
          unoptimized
        />
        {canShowOverlay && overlayEnabled && imageRect ? (
          <div
            className="pointer-events-none absolute"
            style={{
              left: imageRect.left,
              top: imageRect.top,
              width: imageRect.width,
              height: imageRect.height,
            }}
            data-testid="detection-overlay"
          >
            {elements.slice(0, 24).map((element) => (
              <div
                role="button"
                tabIndex={0}
                key={element.id}
                className={cn(
                  "pointer-events-auto absolute cursor-move rounded-[3px] border bg-background/15 text-left shadow-[0_0_0_1px_rgb(255_255_255_/_0.55)] transition",
                  detectionClassName(element.kind),
                  element.included === false && "border-dashed opacity-35",
                  selectedElement?.id === element.id && "ring-2 ring-foreground",
                )}
                style={boxToOverlayStyle(element, {
                  sourceWidth: imageWidth ?? 1,
                  sourceHeight: imageHeight ?? 1,
                  renderedWidth: imageRect.width,
                  renderedHeight: imageRect.height,
                })}
                data-testid="detection-box"
                data-detection-id={element.id}
                data-kind={element.kind}
                data-primitive={element.primitive ?? primitiveForKind(element.kind)}
                data-confidence={element.confidence}
                data-box={`${element.box.x},${element.box.y},${element.box.width},${element.box.height}`}
                aria-label={`Select ${element.kind}`}
                onClick={() => setSelectedElementId(element.id)}
                onKeyDown={(event) => handleDetectionBoxKeyDown(event, element)}
                onPointerDown={(event) => startBoxInteraction(event, element, "move")}
              >
                <span className="absolute left-0 top-0 max-w-full truncate rounded-br-[3px] bg-background/90 px-1 py-0.5 text-[10px] font-medium leading-none text-foreground shadow-sm">
                  {element.kind} - {Math.round(element.confidence * 100)}%
                </span>
                {debugEnabled ? (
                  <span
                    className="absolute bottom-0 left-0 max-w-[calc(100%-1rem)] truncate rounded-tr-[3px] bg-background/90 px-1 py-0.5 text-[9px] font-mono leading-none text-muted-foreground shadow-sm"
                    data-testid="detection-debug-label"
                  >
                    {element.primitive ?? primitiveForKind(element.kind)}{" "}
                    {Math.round(element.box.x)},{Math.round(element.box.y)}{" "}
                    {Math.round(element.box.width)}x{Math.round(element.box.height)}
                  </span>
                ) : null}
                <span
                  className="absolute bottom-0 right-0 size-4 cursor-se-resize rounded-tl-[3px] border-l border-t border-background/70 bg-foreground/80"
                  data-testid="detection-resize-handle-se"
                  aria-hidden
                  onPointerDown={(event) => startBoxInteraction(event, element, "resize")}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {canShowOverlay ? (
        <Card className="bg-background" data-testid="detector-quality-dashboard">
          <CardContent className="space-y-3 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant={qualityStats.reviewCount ? "destructive" : "secondary"}>
                  {qualityStats.reviewCount} review
                </Badge>
                <Badge variant="outline">{qualityStats.editedCount} edited</Badge>
                <Badge variant="outline">{qualityStats.excludedCount} excluded</Badge>
                <Badge
                  variant="secondary"
                  data-testid="visual-diff-score"
                  data-visual-method={qualityStats.visualMethod}
                >
                  {qualityStats.visualScore}% visual match
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={debugEnabled ? "secondary" : "outline"}
                  size="sm"
                  className="gap-2"
                  onClick={() => setDebugEnabled((value) => !value)}
                  aria-pressed={debugEnabled}
                  data-testid="toggle-detector-debug"
                >
                  <Bug className="size-3.5" aria-hidden />
                  Debug
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={onUndoDetections}
                  disabled={!canUndoDetections}
                  data-testid="undo-detection-edit"
                >
                  <Undo2 className="size-3.5" aria-hidden />
                  Undo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={onRedoDetections}
                  disabled={!canRedoDetections}
                  data-testid="redo-detection-edit"
                >
                  <Redo2 className="size-3.5" aria-hidden />
                  Redo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={onSnapDetections}
                  data-testid="snap-detections-grid"
                >
                  <Grid2X2 className="size-3.5" aria-hidden />
                  Snap
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={onExportDetections}
                  data-testid="export-detections-json"
                >
                  <Download className="size-3.5" aria-hidden />
                  JSON
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {selectedElement ? (
        <Card className="bg-background" data-testid="detection-details">
          <CardContent className="space-y-3 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {copy.detectionDetails}
                </p>
                <p className="mt-1 text-sm font-medium text-card-foreground">
                  {selectedElement.primitive ?? primitiveForKind(selectedElement.kind)} -{" "}
                  {Math.round(selectedElement.confidence * 100)}% confidence
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={selectedElement.included === false ? "outline" : "secondary"}
                  size="sm"
                  className="gap-2"
                  onClick={() =>
                    updateElement(selectedElement.id, {
                      included: selectedElement.included === false,
                    })
                  }
                  data-testid="toggle-detection-include"
                >
                  <Check className="size-3.5" aria-hidden />
                  {selectedElement.included === false
                    ? copy.detectionInclude
                    : copy.detectionIncluded}
                </Button>
                {onResetDetections ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={onResetDetections}
                    data-testid="reset-detections"
                  >
                    <RotateCcw className="size-3.5" aria-hidden />
                    {copy.detectionReset}
                  </Button>
                ) : null}
              </div>
            </div>

            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              {copy.detectionElementType}
              <select
                value={selectedElement.kind}
                onChange={(event) =>
                  updateElement(selectedElement.id, {
                    kind: event.target.value,
                    primitive: primitiveForKind(event.target.value),
                  })
                }
                className="min-h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                data-testid="detection-kind-select"
              >
                {DETECTION_KIND_OPTIONS.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-wrap gap-1.5">
              {(selectedElement.reasons ?? []).slice(0, 4).map((reason) => (
                <Badge key={reason.code} variant="outline" className="max-w-full">
                  <span className="truncate">{reason.label}</span>
                </Badge>
              ))}
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {(selectedElement.reasons ?? []).slice(0, 3).map((reason) => (
                <li key={reason.code}>{reason.evidence}</li>
              ))}
            </ul>

            {debugEnabled ? (
              <div
                className="grid gap-2 rounded-md border border-border bg-muted/30 p-3 text-xs"
                data-testid="detection-debug-panel"
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <DebugField label="Element ID" value={selectedElement.id} />
                  <DebugField
                    label="Primitive"
                    value={selectedElement.primitive ?? primitiveForKind(selectedElement.kind)}
                  />
                  <DebugField
                    label="Geometry"
                    value={`${selectedElement.box.x}, ${selectedElement.box.y}, ${selectedElement.box.width}x${selectedElement.box.height}`}
                  />
                  <DebugField
                    label="Confidence"
                    value={`${Math.round(selectedElement.confidence * 100)}%`}
                  />
                  <DebugField
                    label="Included"
                    value={selectedElement.included === false ? "false" : "true"}
                  />
                  <DebugField
                    label="Visual score"
                    value={`${qualityStats.visualScore}% ${qualityStats.visualMethod}`}
                  />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Reason weights</p>
                  {(selectedElement.reasons ?? []).map((reason) => (
                    <div
                      key={reason.code}
                      className="grid gap-1 rounded-sm bg-background/70 p-2 sm:grid-cols-[8rem_1fr_4rem]"
                    >
                      <span className="font-mono text-muted-foreground">{reason.code}</span>
                      <span className="truncate text-foreground">{reason.label}</span>
                      <span className="font-mono text-muted-foreground">
                        {Math.round(reason.weight * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function DebugField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="font-medium text-foreground">{label}</p>
      <p className="truncate font-mono text-muted-foreground">{value}</p>
    </div>
  );
}

function calculateObjectContainRect({
  containerWidth,
  containerHeight,
  imageWidth,
  imageHeight,
}: {
  containerWidth: number;
  containerHeight: number;
  imageWidth: number;
  imageHeight: number;
}) {
  if (!containerWidth || !containerHeight || !imageWidth || !imageHeight) return null;
  const scale = Math.min(containerWidth / imageWidth, containerHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    left: (containerWidth - width) / 2,
    top: (containerHeight - height) / 2,
    width,
    height,
  };
}

function boxToOverlayStyle(
  element: DetectionElement,
  {
    sourceWidth,
    sourceHeight,
    renderedWidth,
    renderedHeight,
  }: {
    sourceWidth: number;
    sourceHeight: number;
    renderedWidth: number;
    renderedHeight: number;
  },
) {
  return {
    left: `${(element.box.x / sourceWidth) * renderedWidth}px`,
    top: `${(element.box.y / sourceHeight) * renderedHeight}px`,
    width: `${(element.box.width / sourceWidth) * renderedWidth}px`,
    height: `${(element.box.height / sourceHeight) * renderedHeight}px`,
  };
}

function clampDetectionBox(
  box: DetectionElement["box"],
  sourceWidth: number,
  sourceHeight: number,
) {
  const width = Math.max(8, Math.min(sourceWidth, Math.round(box.width)));
  const height = Math.max(8, Math.min(sourceHeight, Math.round(box.height)));
  return {
    x: Math.max(0, Math.min(sourceWidth - width, Math.round(box.x))),
    y: Math.max(0, Math.min(sourceHeight - height, Math.round(box.y))),
    width,
    height,
  };
}

function snapDetectionBoxToGrid(
  box: DetectionElement["box"],
  {
    sourceWidth,
    sourceHeight,
    columns,
    rows,
  }: {
    sourceWidth: number;
    sourceHeight: number;
    columns: number;
    rows: number;
  },
) {
  const cellWidth = Math.max(1, sourceWidth / columns);
  const cellHeight = Math.max(1, sourceHeight / rows);
  const snapped = {
    x: Math.round(box.x / cellWidth) * cellWidth,
    y: Math.round(box.y / cellHeight) * cellHeight,
    width: Math.max(cellWidth, Math.round(box.width / cellWidth) * cellWidth),
    height: Math.max(cellHeight, Math.round(box.height / cellHeight) * cellHeight),
  };
  return clampDetectionBox(snapped, sourceWidth, sourceHeight);
}

function buildDetectionQualityStats(
  elements: DetectionElement[],
  quality?: DetectionQuality | null,
  rasterVisualScore?: number | null,
) {
  const active = elements.filter((element) => element.included !== false);
  const editedCount = elements.filter((element) => element.userEdited).length;
  const excludedCount = elements.length - active.length;
  const lowConfidenceCount = active.filter((element) => element.confidence < 0.62).length;
  const reviewCount =
    lowConfidenceCount + (quality?.ambiguity === "high" ? 1 : 0) + excludedCount;
  const visualScore = rasterVisualScore ?? estimateVisualDiffScore(elements, quality);
  return {
    activeCount: active.length,
    editedCount,
    excludedCount,
    reviewCount,
    visualScore,
    visualMethod: rasterVisualScore === null || rasterVisualScore === undefined ? "heuristic" : "raster",
  };
}

async function estimateRasterVisualMatchScore({
  previewUrl,
  elements,
  sourceWidth,
  sourceHeight,
  tokens,
}: {
  previewUrl: string;
  elements: DetectionElement[];
  sourceWidth: number;
  sourceHeight: number;
  tokens?: DetectionDesignTokens | null;
}) {
  if (
    typeof document === "undefined" ||
    typeof window === "undefined" ||
    typeof window.Image === "undefined" ||
    !sourceWidth ||
    !sourceHeight
  ) {
    return null;
  }

  const active = elements.filter((element) => element.included !== false);
  if (!active.length) return 0;

  try {
    const image = await loadVisualDiffImage(previewUrl);
    const maxDimension = 128;
    const scale = Math.min(maxDimension / sourceWidth, maxDimension / sourceHeight);
    const canvasWidth = Math.max(32, Math.round(sourceWidth * scale));
    const canvasHeight = Math.max(32, Math.round(sourceHeight * scale));
    const screenshotCanvas = document.createElement("canvas");
    screenshotCanvas.width = canvasWidth;
    screenshotCanvas.height = canvasHeight;
    const screenshotContext = screenshotCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    const mockCanvas = document.createElement("canvas");
    mockCanvas.width = canvasWidth;
    mockCanvas.height = canvasHeight;
    const mockContext = mockCanvas.getContext("2d", { willReadFrequently: true });
    if (!screenshotContext || !mockContext) return null;

    screenshotContext.fillStyle = "#ffffff";
    screenshotContext.fillRect(0, 0, canvasWidth, canvasHeight);
    screenshotContext.drawImage(image, 0, 0, canvasWidth, canvasHeight);
    renderDetectionMockToCanvas(mockContext, {
      elements: active,
      sourceWidth,
      sourceHeight,
      canvasWidth,
      canvasHeight,
      tokens,
    });

    const screenshotData = screenshotContext.getImageData(
      0,
      0,
      canvasWidth,
      canvasHeight,
    ).data;
    const mockData = mockContext.getImageData(0, 0, canvasWidth, canvasHeight).data;
    const diff = compareRasterSignals(screenshotData, mockData, canvasWidth, canvasHeight);
    const coverage = calculateDetectionCoverage(active, sourceWidth, sourceHeight);
    const coverageAdjustment = Math.min(1, Math.max(0.72, coverage * 2.8));
    return Math.max(0, Math.min(100, Math.round((100 - diff * 100) * coverageAdjustment)));
  } catch {
    return null;
  }
}

function loadVisualDiffImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image for visual diff"));
    image.src = src;
  });
}

function renderDetectionMockToCanvas(
  context: CanvasRenderingContext2D,
  {
    elements,
    sourceWidth,
    sourceHeight,
    canvasWidth,
    canvasHeight,
    tokens,
  }: {
    elements: DetectionElement[];
    sourceWidth: number;
    sourceHeight: number;
    canvasWidth: number;
    canvasHeight: number;
    tokens?: DetectionDesignTokens | null;
  },
) {
  const palette = detectionPreviewTokens(tokens);
  context.fillStyle = palette.surface;
  context.fillRect(0, 0, canvasWidth, canvasHeight);

  for (const element of elements) {
    const x = (element.box.x / sourceWidth) * canvasWidth;
    const y = (element.box.y / sourceHeight) * canvasHeight;
    const width = Math.max(1, (element.box.width / sourceWidth) * canvasWidth);
    const height = Math.max(1, (element.box.height / sourceHeight) * canvasHeight);
    const primitive = element.primitive ?? primitiveForKind(element.kind);
    const isAccent = /header|nav|button|action|control|field/i.test(primitive);
    const isMedia = /media|chart/i.test(primitive);

    context.fillStyle = isAccent ? palette.accent : isMedia ? palette.muted : palette.surface;
    context.strokeStyle = isAccent ? palette.accent : palette.border;
    context.lineWidth = 1;
    context.fillRect(x, y, width, height);
    context.strokeRect(x + 0.5, y + 0.5, Math.max(0, width - 1), Math.max(0, height - 1));

    if (/text|row|field|button|action/i.test(primitive)) {
      context.fillStyle = isAccent ? palette.accentForeground : palette.foreground;
      const lineHeight = Math.max(2, Math.min(6, height * 0.22));
      const lineWidth = Math.max(4, width * 0.66);
      context.fillRect(x + width * 0.12, y + height * 0.42, lineWidth, lineHeight);
    }
  }
}

function compareRasterSignals(
  screenshotData: Uint8ClampedArray,
  mockData: Uint8ClampedArray,
  width: number,
  height: number,
) {
  let totalDiff = 0;
  let samples = 0;
  const stride = 2;
  for (let y = 0; y < height - stride; y += stride) {
    for (let x = 0; x < width - stride; x += stride) {
      const index = (y * width + x) * 4;
      const rightIndex = (y * width + x + stride) * 4;
      const downIndex = ((y + stride) * width + x) * 4;
      const screenshotSignal = rasterPixelSignal(screenshotData, index, rightIndex, downIndex);
      const mockSignal = rasterPixelSignal(mockData, index, rightIndex, downIndex);
      totalDiff += Math.abs(screenshotSignal - mockSignal);
      samples += 1;
    }
  }
  return samples ? totalDiff / samples : 1;
}

function rasterPixelSignal(
  data: Uint8ClampedArray,
  index: number,
  rightIndex: number,
  downIndex: number,
) {
  const luma = pixelLuma(data, index);
  const right = pixelLuma(data, rightIndex);
  const down = pixelLuma(data, downIndex);
  const edge = Math.min(1, (Math.abs(luma - right) + Math.abs(luma - down)) / 160);
  const ink = Math.min(1, Math.abs(255 - luma) / 255);
  return edge * 0.72 + ink * 0.28;
}

function pixelLuma(data: Uint8ClampedArray, index: number) {
  return data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722;
}

function calculateDetectionCoverage(
  elements: DetectionElement[],
  sourceWidth: number,
  sourceHeight: number,
) {
  const sourceArea = Math.max(1, sourceWidth * sourceHeight);
  const coveredArea = elements.reduce((sum, element) => {
    const width = Math.max(0, Math.min(sourceWidth, element.box.width));
    const height = Math.max(0, Math.min(sourceHeight, element.box.height));
    return sum + width * height;
  }, 0);
  return Math.min(1, coveredArea / sourceArea);
}

function estimateVisualDiffScore(
  elements: DetectionElement[],
  quality?: DetectionQuality | null,
) {
  const active = elements.filter((element) => element.included !== false);
  if (!active.length) return 0;
  const averageConfidence =
    active.reduce((sum, element) => sum + element.confidence, 0) / active.length;
  const editPenalty = Math.min(0.18, elements.filter((element) => element.userEdited).length * 0.02);
  const excludedPenalty = Math.min(0.25, (elements.length - active.length) * 0.04);
  const ambiguityPenalty =
    quality?.ambiguity === "high" ? 0.12 : quality?.ambiguity === "medium" ? 0.06 : 0;
  return Math.max(
    0,
    Math.min(100, Math.round((averageConfidence - editPenalty - excludedPenalty - ambiguityPenalty) * 100)),
  );
}

function detectionClassName(kind: string) {
  if (/nav|header/i.test(kind)) return "border-sky-500";
  if (/button|input|control/i.test(kind)) return "border-emerald-500";
  if (/chart|media/i.test(kind)) return "border-amber-500";
  return "border-primary";
}

function primitiveForKind(kind: string) {
  if (kind === "button-or-input" || kind === "input-or-button-row") {
    return "field-or-action";
  }
  if (kind === "chart-or-media") return "media";
  if (kind === "card-or-panel") return "card";
  if (kind === "text-row") return "text";
  if (kind === "content-block") return "section";
  return kind;
}

function detectionPreviewTokens(tokens?: DetectionDesignTokens | null) {
  return {
    surface: tokens?.surface ?? "#ffffff",
    foreground: tokens?.foreground ?? "#111827",
    accent: tokens?.accent ?? "#2563eb",
    accentForeground: tokens?.accentForeground ?? "#ffffff",
    muted: tokens?.muted ?? "#f3f4f6",
    border: tokens?.border ?? "#d1d5db",
  };
}

function DetectionComparisonPreview({
  previewUrl,
  artifact,
  alt,
  copy,
}: {
  previewUrl: string | null;
  artifact: UiFlowArtifact;
  alt: string;
  copy: UploadFlowDictionary;
}) {
  const detections = artifact.detections;
  const sourceWidth = detections?.source?.width ?? artifact.file.width ?? 1;
  const sourceHeight = detections?.source?.height ?? artifact.file.height ?? 1;
  const tokens = detectionPreviewTokens(detections?.designTokens);
  const activeElements = (detections?.elements ?? []).filter(
    (element) => element.included !== false,
  );

  return (
    <Card className="min-w-0 bg-background" data-testid="generated-comparison-preview">
      <CardHeader>
        <CardTitle className="text-sm">{copy.livePreview}</CardTitle>
        <CardDescription className="text-xs">
          {copy.comparisonPreviewDesc}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid min-w-0 gap-3 lg:grid-cols-2">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.comparisonScreenshot}
            </p>
            <div className="relative h-72 overflow-hidden rounded-md border border-border">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt={alt}
                  className="object-contain"
                  fill
                  sizes="(max-width: 1024px) 100vw, 480px"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  {artifact.file.name}
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.comparisonGeneratedMock}
            </p>
            <div
              className="relative h-72 overflow-hidden rounded-md border"
              data-testid="generated-mock-canvas"
              style={{
                backgroundColor: tokens.surface,
                borderColor: tokens.border,
                color: tokens.foreground,
              }}
            >
              {activeElements.slice(0, 20).map((element) => (
                <div
                  key={element.id}
                  className="absolute overflow-hidden border p-1.5 text-[10px] shadow-sm"
                  style={{
                    left: `${(element.box.x / sourceWidth) * 100}%`,
                    top: `${(element.box.y / sourceHeight) * 100}%`,
                    width: `${(element.box.width / sourceWidth) * 100}%`,
                    height: `${(element.box.height / sourceHeight) * 100}%`,
                    minHeight: "1.75rem",
                    borderColor: tokens.border,
                    borderRadius: "0.375rem",
                    backgroundColor: /header|nav|action|button|field/i.test(
                      element.primitive ?? element.kind,
                    )
                      ? tokens.accent
                      : /card|media|section/i.test(element.primitive ?? element.kind)
                        ? tokens.muted
                        : tokens.surface,
                    color: /header|nav|action|button|field/i.test(
                      element.primitive ?? element.kind,
                    )
                      ? tokens.accentForeground
                      : tokens.foreground,
                  }}
                  data-testid="generated-mock-element"
                  data-detection-id={element.id}
                  data-kind={element.kind}
                  data-primitive={element.primitive ?? primitiveForKind(element.kind)}
                >
                  <GeneratedMockPrimitive element={element} tokens={tokens} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {artifact.previewStats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">{stat.label}</div>
                <div className="mt-2 text-2xl font-bold text-card-foreground">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function GeneratedMockPrimitive({
  element,
  tokens,
}: {
  element: DetectionElement;
  tokens: ReturnType<typeof detectionPreviewTokens>;
}) {
  const primitive = element.primitive ?? primitiveForKind(element.kind);
  const label = primitive.replace(/-/g, " ");

  if (/header|nav/.test(primitive)) {
    return (
      <div className="flex h-full min-h-8 items-center gap-1.5">
        <span className="h-2.5 w-8 rounded-full bg-current opacity-90" />
        <span className="h-1.5 w-5 rounded-full bg-current opacity-55" />
        <span className="h-1.5 w-5 rounded-full bg-current opacity-40" />
      </div>
    );
  }

  if (/field|action|button|input/.test(primitive)) {
    return (
      <div className="flex h-full min-h-8 items-center justify-between gap-2">
        <span className="h-2 w-1/2 rounded-full bg-current opacity-55" />
        <span
          className="h-5 w-12 rounded-sm"
          style={{ backgroundColor: tokens.accentForeground, opacity: 0.9 }}
        />
      </div>
    );
  }

  if (/media|chart/.test(primitive)) {
    return (
      <div className="flex h-full min-h-10 items-end gap-1">
        {[0.38, 0.72, 0.54, 0.9].map((height, index) => (
          <span
            key={index}
            className="w-1/5 rounded-t-sm bg-current opacity-60"
            style={{ height: `${height * 100}%` }}
          />
        ))}
      </div>
    );
  }

  if (/card|section|list-item/.test(primitive)) {
    return (
      <div className="space-y-1.5">
        <span className="block h-2 w-2/3 rounded-full bg-current opacity-70" />
        <span className="block h-1.5 w-full rounded-full bg-current opacity-35" />
        <span className="block h-1.5 w-4/5 rounded-full bg-current opacity-25" />
      </div>
    );
  }

  return (
    <div>
      <div className="truncate font-semibold">{label}</div>
      <div className="truncate opacity-75">{element.kind}</div>
    </div>
  );
}

export interface UploadFlowProps {
  /** Bundled reference sample id (dashboard, auth, mobile, …) for /demo */
  demoArchetype?: string;
  /** Load sample + run analyze on mount (one-click demo route) */
  autoRunDemo?: boolean;
}

export function UploadFlow({
  demoArchetype,
  autoRunDemo = false,
}: UploadFlowProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, dict } = useLocale();
  const t = dict.uploadFlow;
  const observability = useObservability();
  const { mode } = useProviderMode();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const originalDetectionsRef = useRef<UiFlowArtifact["detections"] | null>(null);
  const detectionHistoryRef = useRef<NonNullable<UiFlowArtifact["detections"]>[]>([]);
  const detectionHistoryIndexRef = useRef(-1);
  const demoBootstrappedRef = useRef<string | null>(null);
  const loadBundledSampleRef = useRef<(sampleId: string) => Promise<void>>(
    async () => {},
  );
  const runPrimaryActionRef = useRef<() => Promise<void>>(async () => {});
  const { toast } = useToast();
  const { savedByLabel } = useAccountIdentity();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [artifact, setArtifact] = useState<UiFlowArtifact | null>(null);
  const [stage, setStage] = useState<Stage>("empty");
  const [error, setError] = useState<string | null>(null);
  const [providerState, setProviderState] = useState<ProviderState>("idle");
  const [providerMessage, setProviderMessage] = useState<string | null>(null);
  const [providerDetail, setProviderDetail] = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const [sampleUsed, setSampleUsed] = useState(() => readSampleUsedFromSession());
  const [userUploadedOwn, setUserUploadedOwn] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState<string | null>(null);
  const [detectionHistoryState, setDetectionHistoryState] = useState({
    index: -1,
    length: 0,
  });
  const flowSteps = useMemo(() => getFlowStepLabels(t), [t]);
  const analyzeStepLabels = useMemo(() => getAnalyzeStepLabels(t), [t]);
  const activeAnalyzeStepIndex = useMemo(
    () => resolveAnalyzeStepIndex(analyzeStep),
    [analyzeStep],
  );
  const [sessions, setSessions] = useState<SessionRecord[]>(() =>
    loadSessionHistory(),
  );
  const [sharedSummary, setSharedSummary] = useState<
    ReturnType<typeof buildShareableSummary>
  >(() => {
    if (typeof window === "undefined") return null;
    return readShareFromLocation() ?? readShareFromSession();
  });
  const [copyingShareLink, setCopyingShareLink] = useState(false);
  const analytics = useMemo(
    () =>
      createAnalyticsClient({
        hooks: observability,
        providerMode: mode,
        route: pathname ?? "/",
      }),
    [mode, observability, pathname],
  );

  function reportAnalyzeFailure(outcome: {
    providerState?: string;
    instantDemo?: boolean;
    code?: string | null;
  }) {
    if (!isReportableAnalyzeFailure(outcome)) return;
    observability?.captureError(buildAnalyzeFailureError(outcome), {
      source: "analyze_route",
      route: pathname ?? "/",
      providerMode: mode,
    });
  }

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fromHash = readShareFromLocation();
    if (!fromHash || typeof window === "undefined") return;

    persistShareSummary(fromHash);

    void createShortShareLink(window.location.origin, fromHash).then((shortLink) => {
      if (shortLink?.url) {
        router.replace(shortLink.url);
      }
    });
  }, [router]);

  function rememberShareableArtifact(nextArtifact: UiFlowArtifact, fileName: string) {
    const payload = buildShareableSummary({
      summary: nextArtifact.summary,
      previewStats: nextArtifact.previewStats,
      modeLabel: nextArtifact.modeLabel,
      detections: nextArtifact.detections,
      file: fileName,
    });
    if (!payload) return null;
    persistShareSummary(payload);
    if (typeof window !== "undefined") {
      const nextHash = `#${encodeShareHash(payload)}`;
      window.history.replaceState(null, "", `${pathname}${nextHash}`);
    }
    return payload;
  }

  async function copyShareLink() {
    if (!artifact?.summary) return;
    const payload =
      buildShareableSummary({
        summary: artifact.summary,
        previewStats: artifact.previewStats,
        modeLabel: artifact.modeLabel,
        detections: artifact.detections,
        file: file?.name ?? t.defaultScreenshotName,
      }) ?? sharedSummary;
    if (!payload || typeof window === "undefined") return;

    setCopyingShareLink(true);
    try {
      persistShareSummary(payload);
      const shortLink = await createShortShareLink(window.location.origin, payload);
      const url =
        shortLink?.url ??
        buildShareUrl(window.location.origin, pathname ?? "/", payload);
      await navigator.clipboard.writeText(url);
      if (shortLink) {
        window.history.replaceState(null, "", shortLink.url);
      } else {
        window.history.replaceState(null, "", `${pathname}#${encodeShareHash(payload)}`);
      }
      toast(
        shortLink?.warning
          ? t.toastShortShareMemory
          : shortLink
            ? t.toastShortShareCopied
            : t.toastShareHashCopied,
        shortLink?.warning ? "warning" : "success",
      );
    } catch {
      toast(t.toastShareFailed, "error");
    } finally {
      setCopyingShareLink(false);
    }
  }

  const showSampleScreenshotButton =
    !sampleUsed && !userUploadedOwn && !file;

  const activeStepIndex = useMemo(() => {
    if (stage === "empty") return -1;
    if (stage === "uploaded") return 0;
    if (stage === "analyzed") return 2;
    return 5;
  }, [stage]);

  const showSplitView = stage === "analyzed" || stage === "generated";

  const analyzeProgress = useMemo(
    () => getAnalyzeProgressPercent(analyzeStep),
    [analyzeStep],
  );

  const isBusy = providerState === "loading" || loadingSample;
  const canRunPrimary = Boolean(file) && providerState !== "loading";
  const experimentConfig = useMemo(() => createExperimentConfig(process.env), []);
  const headlineVariant = useMemo(
    () => resolveExperimentVariant("uploadFlowHeadline", "anonymous", experimentConfig),
    [experimentConfig],
  );
  const analyzeCtaVariant = useMemo(
    () => resolveExperimentVariant("uploadFlowAnalyzeCta", "anonymous", experimentConfig),
    [experimentConfig],
  );
  const samplePathHintVariant = useMemo(
    () => resolveExperimentVariant("uploadFlowSamplePathHint", "anonymous", experimentConfig),
    [experimentConfig],
  );
  const primaryCtaLabel = useMemo(() => {
    if (providerState === "loading") return t.ctaAnalyzing;
    if (stage === "generated") return t.ctaRegenerate;
    if (stage === "analyzed") return t.ctaGenerate;
    if (file) {
      return analyzeCtaVariant === "analyze-now"
        ? t.ctaAnalyzeNow
        : t.ctaAnalyzePreview;
    }
    return t.ctaAnalyzePreview;
  }, [analyzeCtaVariant, file, providerState, stage, t]);

  const exportFilename = useMemo(() => {
    if (file?.name) {
      return referenceSampleExportFilename(getReferenceSampleByFileName(file.name).id);
    }
    if (demoArchetype) {
      return referenceSampleExportFilename(demoArchetype);
    }
    if (file?.name) {
      const base = file.name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-");
      return `generated-${base || "scaffold"}.tsx`;
    }
    return "generated-scaffold.tsx";
  }, [demoArchetype, file]);

  function acceptFile(
    nextFile: File | null,
    source: "dropzone" | "sample" = "dropzone",
  ) {
    setError(null);
    setArtifact(null);
    setProviderState("idle");
    setProviderMessage(null);
    setProviderDetail(null);
    originalDetectionsRef.current = null;
    resetDetectionHistory(null);

    if (!nextFile) return;

    if (source === "dropzone") {
      setUserUploadedOwn(true);
    }

    const validation = validateUploadImageFile(nextFile);
    if (!validation.ok) {
      const message =
        validation.reason === "size"
          ? interpolate(t.errorImageTooLarge, {
              maxSize: formatUploadSize(validation.maxBytes ?? MAX_UPLOAD_BYTES),
            })
          : t.errorInvalidImage;
      setError(message);
      analytics.track(AnalyticsEvent.UploadRejected, {
        source: "upload_dropzone",
        fileType: nextFile.type || "unknown",
        fileSize: nextFile.size,
        status: "rejected",
        result: validation.reason,
      });
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setPreviewUrl(null);
      setFile(null);
      setStage("empty");
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(nextFile);
    previewUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
    setFile(nextFile);
    setStage("uploaded");
    analytics.track(AnalyticsEvent.UploadSelected, {
      source: "upload_dropzone",
      fileType: nextFile.type || "unknown",
      fileSize: nextFile.size,
      step: "upload",
      status: "accepted",
    });
  }

  async function analyzeImage() {
    if (!file) {
      setError(t.errorNoImage);
      return null;
    }

    setError(null);
    setProviderState("loading");
    setAnalyzeStep(ANALYZE_STEPS_EN[0]);
    const startedAt = currentTimestamp();
    analytics.track(AnalyticsEvent.AnalyzeStarted, {
      source: "upload_flow",
      fileType: file.type || "unknown",
      fileSize: file.size,
      step: "analyze",
      status: "started",
    });

    try {
      const { postAnalyzeUi, preprocessImageDataUrl } = await loadAnalyzeModules();
      setAnalyzeStep(ANALYZE_STEPS_EN[1]);
      const rawDataUrl = await readFileAsDataUrl(file);
      const preprocessed = await preprocessImageDataUrl(rawDataUrl);

      const fileMeta = {
        name: file.name,
        type: file.type,
        size: file.size,
        width: preprocessed.width,
        height: preprocessed.height,
        offlineInspection: preprocessed.offlineInspection,
        svgInspection: preprocessed.svgInspection,
      };

      setAnalyzeStep(ANALYZE_STEPS_EN[2]);
      const outcome = await postAnalyzeUi(fileMeta, preprocessed.dataUrl, {
        onProgress: (step) => setAnalyzeStep(step),
      });
      const nextArtifact = outcome.artifact as UiFlowArtifact;
      originalDetectionsRef.current = cloneDetections(nextArtifact.detections);
      resetDetectionHistory(nextArtifact.detections);

      setArtifact(nextArtifact);
      setProviderState(outcome.providerState as ProviderState);
      setProviderMessage(outcome.message);
      setProviderDetail(outcome.detail);
      setStage("analyzed");
      reportAnalyzeFailure(outcome);

      const record: SessionRecord = {
        id: crypto.randomUUID(),
        timestamp: currentTimestamp(),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        modeLabel: nextArtifact.modeLabel || t.modeLocalDemo,
        providerState: outcome.providerState as "qwen" | "fallback",
        savedBy: savedByLabel,
        summary: nextArtifact.summary,
        artifact: {
          plan: nextArtifact.plan,
          previewStats: nextArtifact.previewStats,
          generatedCode: nextArtifact.generatedCode,
          modeLabel: nextArtifact.modeLabel,
          summary: nextArtifact.summary,
          detections: nextArtifact.detections,
        },
      };
      saveSession(record);
      setSessions(loadSessionHistory());
      const sharePayload = rememberShareableArtifact(
        nextArtifact,
        file.name,
      );
      if (sharePayload) {
        setSharedSummary(sharePayload);
      }

      if (outcome.instantDemo) {
        toast(t.toastInstantDemo, "warning");
      } else if (outcome.providerState === "qwen") {
        toast(t.toastQwenComplete, "success");
      } else {
        toast(t.toastFallback, "warning");
      }
      analytics.track(AnalyticsEvent.AnalyzeCompleted, {
        source: "upload_flow",
        providerState: String(outcome.providerState ?? "unknown"),
        fileType: file.type || "unknown",
        fileSize: file.size,
        step: "analyze",
        status: outcome.instantDemo ? "instant_demo" : "completed",
        durationMs: currentTimestamp() - startedAt,
      });

      return nextArtifact;
    } catch {
      const { resolveAnalyzeOutcome } = await import("../lib/analyze-outcome.mjs");
      const outcome = resolveAnalyzeOutcome({
        file: { name: file.name, type: file.type, size: file.size },
        fetchError: "Could not read the uploaded image.",
      });
      const nextArtifact = outcome.artifact as UiFlowArtifact;
      originalDetectionsRef.current = cloneDetections(nextArtifact.detections);
      resetDetectionHistory(nextArtifact.detections);
      setArtifact(nextArtifact);
      setProviderState(outcome.providerState as ProviderState);
      setProviderMessage(outcome.message);
      setProviderDetail(outcome.detail);
      setStage("analyzed");
      reportAnalyzeFailure(outcome);
      toast(t.toastAnalyzeFailed, "error");
      analytics.track(AnalyticsEvent.AnalyzeFailed, {
        source: "upload_flow",
        providerState: String(outcome.providerState ?? "fallback"),
        fileType: file.type || "unknown",
        fileSize: file.size,
        step: "analyze",
        status: "fallback",
        durationMs: currentTimestamp() - startedAt,
      });
      return nextArtifact;
    } finally {
      setAnalyzeStep(null);
    }
  }

  function updateArtifactDetectionsWithHistory(
    nextDetections: UiFlowArtifact["detections"],
    options: DetectionChangeOptions = {},
  ) {
    if (options.recordHistory !== false && nextDetections) {
      pushDetectionHistory(nextDetections);
    }
    setArtifact((current) =>
      current
        ? {
            ...current,
            detections: nextDetections,
          }
        : current,
    );
    if (stage === "generated") {
      setStage("analyzed");
    }
  }

  function resetArtifactDetections() {
    if (!originalDetectionsRef.current) return;
    const nextDetections = cloneDetections(originalDetectionsRef.current);
    if (nextDetections) {
      updateArtifactDetectionsWithHistory(nextDetections, { recordHistory: true });
    }
  }

  function pushDetectionHistory(detections: NonNullable<UiFlowArtifact["detections"]>) {
    const cloned = cloneDetections(detections);
    if (!cloned) return;
    const next = detectionHistoryRef.current.slice(
      0,
      detectionHistoryIndexRef.current + 1,
    );
    next.push(cloned);
    detectionHistoryRef.current = next.slice(-24);
    detectionHistoryIndexRef.current = detectionHistoryRef.current.length - 1;
    setDetectionHistoryState({
      index: detectionHistoryIndexRef.current,
      length: detectionHistoryRef.current.length,
    });
  }

  function resetDetectionHistory(detections: UiFlowArtifact["detections"] | null) {
    const cloned = cloneDetections(detections);
    detectionHistoryRef.current = cloned ? [cloned] : [];
    detectionHistoryIndexRef.current = cloned ? 0 : -1;
    setDetectionHistoryState({
      index: detectionHistoryIndexRef.current,
      length: detectionHistoryRef.current.length,
    });
  }

  function applyDetectionHistory(index: number) {
    const nextDetections = cloneDetections(detectionHistoryRef.current[index]);
    if (!nextDetections) return;
    detectionHistoryIndexRef.current = index;
    setDetectionHistoryState({
      index,
      length: detectionHistoryRef.current.length,
    });
    updateArtifactDetectionsWithHistory(nextDetections, { recordHistory: false });
  }

  function undoDetectionEdit() {
    if (detectionHistoryIndexRef.current <= 0) return;
    applyDetectionHistory(detectionHistoryIndexRef.current - 1);
  }

  function redoDetectionEdit() {
    if (
      detectionHistoryIndexRef.current >=
      detectionHistoryRef.current.length - 1
    ) {
      return;
    }
    applyDetectionHistory(detectionHistoryIndexRef.current + 1);
  }

  function snapArtifactDetectionsToGrid() {
    if (!artifact?.detections) return;
    const sourceWidth =
      artifact.detections.source?.width ?? artifact.file.width ?? 1;
    const sourceHeight =
      artifact.detections.source?.height ?? artifact.file.height ?? 1;
    const snapped = {
      ...artifact.detections,
      elements: artifact.detections.elements.map((element) => ({
        ...element,
        box: snapDetectionBoxToGrid(element.box, {
          sourceWidth,
          sourceHeight,
          columns: 12,
          rows: 8,
        }),
        userEdited: true,
      })),
    };
    updateArtifactDetectionsWithHistory(snapped, { recordHistory: true });
  }

  function exportArtifactDetections() {
    if (!artifact?.detections || typeof document === "undefined") return;
    const payload = {
      file: artifact.file.name,
      exportedAt: new Date(currentTimestamp()).toISOString(),
      detections: artifact.detections,
    };
    downloadTextFile(
      JSON.stringify(payload, null, 2),
      `${artifact.file.name.replace(/\.[^.]+$/, "") || "screenshot"}.detections.json`,
      "application/json;charset=utf-8",
    );
  }

  function exportHandoffBundle() {
    if (!artifact || typeof document === "undefined") return;
    const baseName =
      artifact.file.name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-") ||
      "screenshot";
    const shareSummary =
      buildShareableSummary({
        summary: artifact.summary,
        previewStats: artifact.previewStats,
        modeLabel: artifact.modeLabel,
        detections: artifact.detections,
        file: file?.name ?? artifact.file.name ?? t.defaultScreenshotName,
      }) ?? sharedSummary;
    const payload = {
      version: 1,
      exportedAt: new Date(currentTimestamp()).toISOString(),
      file: artifact.file,
      modeLabel: artifact.modeLabel,
      summary: artifact.summary,
      previewStats: artifact.previewStats,
      plan: artifact.plan,
      generatedCode: artifact.generatedCode,
      exports: {
        tsxFilename: exportFilename,
        detectionsFilename: `${baseName}.detections.json`,
      },
      detections: artifact.detections,
      shareSummary,
      notes: [
        "Generated code is included for handoff only; review imports before dropping it into another app.",
        "Detection boxes may include user edits from the current browser session.",
      ],
    };
    downloadTextFile(
      JSON.stringify(payload, null, 2),
      `${baseName}.handoff.json`,
      "application/json;charset=utf-8",
    );
    toast(t.toastHandoffBundleExported, "success");
  }

  async function finishPreviewGeneration(
    nextArtifact: UiFlowArtifact | null,
    toastMessage = t.toastPreviewGenerated,
  ) {
    if (!nextArtifact) return;
    if (file) {
      const record: SessionRecord = {
        id: crypto.randomUUID(),
        timestamp: currentTimestamp(),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        modeLabel: nextArtifact.modeLabel || t.modeLocalDemo,
        providerState: providerState === "qwen" ? "qwen" : "fallback",
        savedBy: savedByLabel,
        summary: nextArtifact.summary,
        artifact: {
          plan: nextArtifact.plan,
          previewStats: nextArtifact.previewStats,
          generatedCode: nextArtifact.generatedCode,
          modeLabel: nextArtifact.modeLabel,
          summary: nextArtifact.summary,
          detections: nextArtifact.detections,
        },
      };
      saveSession(record);
      setSessions(loadSessionHistory());
    }
    setStage("generated");
    toast(toastMessage, "success");
    analytics.track(AnalyticsEvent.GenerateCompleted, {
      source: "upload_flow",
      step: "generate",
      status: "completed",
      fileType: file?.type || "unknown",
      fileSize: file?.size ?? 0,
    });
  }

  async function generatePreview() {
    if (!file) return;
    analytics.track(AnalyticsEvent.GenerateStarted, {
      source: "upload_flow",
      step: "generate",
      status: "started",
      fileType: file.type || "unknown",
      fileSize: file.size,
    });

    let nextArtifact = artifact;
    if (!nextArtifact) {
      nextArtifact = await analyzeImage();
    }
    if (nextArtifact?.detections) {
      const { regenerateArtifactFromDetections } = await import("../lib/ui-flow.mjs");
      nextArtifact = regenerateArtifactFromDetections(
        nextArtifact,
        nextArtifact.detections,
      ) as UiFlowArtifact;
      setArtifact(nextArtifact);
    }
    await finishPreviewGeneration(nextArtifact);
  }

  async function runPrimaryAction() {
    if (!file) {
      setError(t.errorNoImage);
      return;
    }

    if (stage === "generated") {
      analytics.track(AnalyticsEvent.GenerateStarted, {
        source: "upload_flow",
        step: "generate",
        status: "started",
        fileType: file.type || "unknown",
        fileSize: file.size,
      });
      const nextArtifact = await analyzeImage();
      await finishPreviewGeneration(nextArtifact, t.toastPreviewRegenerated);
      return;
    }

    await generatePreview();
  }

  function restoreSession(record: SessionRecord) {
    setArtifact({
      file: {
        name: record.fileName,
        type: record.fileType,
        size: record.fileSize,
        readableSize: formatBytes(record.fileSize),
        width: null,
        height: null,
      },
      steps: flowSteps,
      plan: record.artifact.plan,
      previewStats: record.artifact.previewStats,
      generatedCode: record.artifact.generatedCode,
      modeLabel: record.modeLabel,
      summary: record.summary,
      detections: record.artifact.detections as UiFlowArtifact["detections"],
    });
    originalDetectionsRef.current = cloneDetections(
      record.artifact.detections as UiFlowArtifact["detections"],
    );
    resetDetectionHistory(record.artifact.detections as UiFlowArtifact["detections"]);
    setProviderState(record.providerState === "qwen" ? "qwen" : "fallback");
    setProviderMessage(
      record.providerState === "qwen" ? t.toastRestoredQwen : t.toastRestoredDemo,
    );
    setStage("analyzed");
    toast(
      interpolate(t.toastRestoredSession, { fileName: record.fileName }),
      "default",
    );
  }

  function deleteSession(id: string) {
    removeSession(id);
    setSessions(loadSessionHistory());
    toast(t.toastSessionRemoved, "default");
  }

  async function loadBundledSample(sampleId: string) {
    const sample =
      BUNDLED_REFERENCE_SAMPLES.find((entry) => entry.id === sampleId) ??
      getReferenceSampleById(sampleId);

    setError(null);
    setLoadingSample(true);
    try {
      const response = await fetch(sample.path);
      if (!response.ok) {
        throw new Error("Sample image unavailable.");
      }
      const blob = await response.blob();
      const sampleFile = new File([blob], sample.fileName, {
        type: blob.type || sample.mimeType || "image/svg+xml",
      });
      acceptFile(sampleFile, "sample");
      setSampleUsed(true);
      persistSampleUsedInSession();
      toast(interpolate(t.toastSampleLoaded, { label: sampleCopy(sample.id, t).label }), "success");
      analytics.track(AnalyticsEvent.UploadSampleLoaded, {
        source: "sample_picker",
        sampleId: sample.id,
        fileType: sampleFile.type || sample.mimeType || "image/svg+xml",
        fileSize: sampleFile.size,
        step: "upload",
        status: "completed",
      });
    } catch {
      setError(t.errorSampleLoad);
      toast(t.toastSampleLoadFailed, "error");
    } finally {
      setLoadingSample(false);
    }
  }

  useEffect(() => {
    loadBundledSampleRef.current = loadBundledSample;
    runPrimaryActionRef.current = runPrimaryAction;
  });

  useEffect(() => {
    if (!autoRunDemo) return;

    const sampleId = demoArchetype ?? "dashboard";
    if (demoBootstrappedRef.current === sampleId) return;
    demoBootstrappedRef.current = sampleId;

    void (async () => {
      await loadBundledSampleRef.current(sampleId);
    })();
  }, [autoRunDemo, demoArchetype]);

  useEffect(() => {
    if (!autoRunDemo || !file || stage !== "uploaded" || providerState === "loading") {
      return;
    }
    void runPrimaryActionRef.current();
  }, [autoRunDemo, file, providerState, stage]);

  return (
    <PageContainer
      as="section"
      id="upload-flow"
      lang={locale}
      className="scroll-mt-20 py-8"
    >
      {providerState === "fallback" ? (
        <Alert
          role="status"
          className="mb-4 border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100"
        >
          <AlertTitle>{t.alertOfflineTitle}</AlertTitle>
          <AlertDescription>
            {providerMessage} {t.alertOfflineBody}
            {providerDetail ? (
              <span className="mt-1 block text-amber-800/80 dark:text-amber-200/80">
                {interpolate(t.alertOfflineReason, { detail: providerDetail })}
              </span>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {sharedSummary && !artifact ? (
        <div className="mb-6">
          <SharedSummaryCard summary={sharedSummary} />
        </div>
      ) : null}

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-muted-foreground">
            {t.liveFlowLabel}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {headlineVariant === "faster-first-value"
              ? t.headlineFaster
              : t.headlineDefault}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {headlineVariant === "faster-first-value"
              ? t.subtitleFaster
              : t.subtitleDefault}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "px-3 py-2 text-sm",
            providerState === "qwen" &&
              "border-success/30 bg-success/10 text-success",
            providerState === "fallback" &&
              "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100",
          )}
        >
          {artifact?.modeLabel ||
            (providerState === "fallback" ? t.modeLocalDemo : t.modeQwenReady)}
        </Badge>
      </div>

      {sessions.length > 0 ? (
        <Card className="mb-6">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-3">
            <CardTitle className="text-sm">{t.recentAnalyses}</CardTitle>
            <CardDescription className="text-xs">
              {interpolate(t.recentAnalysesStored, {
                count: String(sessions.length),
              })}
              {" · "}
              {interpolate(t.recentAnalysesSavedBy, { name: savedByLabel })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-2">
              {sessions.map((session) => (
                <li key={session.id} className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => restoreSession(session)}
                    className="h-auto py-1.5 text-xs"
                  >
                    {session.fileName}
                    <span className="ml-1.5 text-muted-foreground">
                      {new Date(session.timestamp).toLocaleDateString()}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => deleteSession(session.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={interpolate(t.removeSessionAria, {
                      fileName: session.fileName,
                    })}
                  >
                    <X className="size-3.5" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="min-w-0 border-border/80 shadow-sm">
          <CardContent className="p-6">
            {!showSplitView ? (
              <UploadDropzone
                previewUrl={previewUrl}
                onFile={acceptFile}
                inputRef={inputRef}
                disabled={providerState === "loading"}
              />
            ) : (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.uploadedReference}
                </p>
                {previewUrl ? (
                  <DetectedReferencePreview
                    key={`${artifact?.file.name ?? "reference"}-${
                      artifact?.detections?.quality?.elementCount ??
                      artifact?.detections?.elements.length ??
                      0
                    }`}
                    previewUrl={previewUrl}
                    alt={
                      file
                        ? interpolate(t.uploadedReferenceAltNamed, {
                            fileName: file.name,
                          })
                        : t.uploadedReferenceAlt
                    }
                    imageWidth={artifact?.file.width}
                    imageHeight={artifact?.file.height}
                    detections={artifact?.detections}
                    copy={t}
                    canUndoDetections={detectionHistoryState.index > 0}
                    canRedoDetections={
                      detectionHistoryState.index >= 0 &&
                      detectionHistoryState.index < detectionHistoryState.length - 1
                    }
                    onDetectionsChange={updateArtifactDetectionsWithHistory}
                    onResetDetections={resetArtifactDetections}
                    onUndoDetections={undoDetectionEdit}
                    onRedoDetections={redoDetectionEdit}
                    onSnapDetections={snapArtifactDetectionsToGrid}
                    onExportDetections={exportArtifactDetections}
                  />
                ) : (
                  <div className="flex min-h-48 items-center justify-center rounded-md border border-border bg-background text-sm text-muted-foreground">
                    {artifact?.file.name ?? t.referenceImage}
                  </div>
                )}
              </div>
            )}

            {file ? (
              <Card className="mt-4 bg-background">
                <CardContent className="p-4 text-sm">
                  <div className="break-words font-medium text-card-foreground">{file.name}</div>
                  <div className="mt-1 text-muted-foreground">
                    {file.type || t.fileUnknownType} ·{" "}
                    {artifact?.file.readableSize ?? t.fileReady}
                    {artifact?.file.width && artifact?.file.height
                      ? ` · ${artifact.file.width}×${artifact.file.height}px`
                      : null}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {error ? (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {showSampleScreenshotButton ? (
                <div
                  className="flex min-w-0 flex-col gap-2"
                  data-testid="sample-picker"
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {t.tryBundledReference}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {BUNDLED_REFERENCE_SAMPLES.map((sample) => {
                      const localized = sampleCopy(sample.id, t);
                      return (
                        <Button
                          key={sample.id}
                          type="button"
                          variant="outline"
                          onClick={() => void loadBundledSample(sample.id)}
                          className="h-auto min-h-11 flex-col items-start gap-0.5 border-dashed px-3 py-2 text-left"
                          disabled={isBusy}
                          aria-label={interpolate(t.loadSampleAria, {
                            label: localized.label,
                          })}
                        >
                          <span className="flex items-center gap-1.5 text-sm font-medium">
                            <UploadCloud className="size-3.5 shrink-0" aria-hidden />
                            {loadingSample ? t.loading : localized.label}
                          </span>
                          <span className="text-[11px] font-normal text-muted-foreground">
                            {localized.hint}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                  {samplePathHintVariant === "show-path-hint" ? (
                    <p className="text-xs text-muted-foreground">
                      {t.samplePathHint}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div
                className={cn(
                  "flex flex-wrap gap-3 md:flex-nowrap md:justify-end",
                  !showSampleScreenshotButton && "w-full md:ml-auto",
                )}
              >
                <Button
                  type="button"
                  onClick={() => void runPrimaryAction()}
                  className="min-h-11 min-w-48 gap-2 shadow-sm disabled:shadow-none"
                  disabled={!canRunPrimary}
                >
                  <Sparkles className="size-4" aria-hidden />
                  {primaryCtaLabel}
                </Button>
              </div>
            </div>

            {providerState === "loading" ? (
              <Card className="mt-4 bg-background" role="status">
                <CardContent className="space-y-3 p-4">
                  <Progress value={analyzeProgress}>
                    <ProgressLabel>
                      {interpolate(t.progressLabel, {
                        step: translateAnalyzeStep(analyzeStep, t),
                        percent: String(Math.round(analyzeProgress)),
                      })}
                    </ProgressLabel>
                  </Progress>
                  <div className="space-y-2">
                    {ANALYZE_STEPS_EN.map((stepEn, index) => (
                      <div
                        key={stepEn}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            analyzeStep === stepEn
                              ? "animate-pulse bg-primary"
                              : activeAnalyzeStepIndex > index
                                ? "bg-success"
                                : "bg-border",
                          )}
                        />
                        {analyzeStepLabels[index]}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 pt-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                    <Skeleton className="h-3 w-3/5" />
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {stage === "analyzed" ? (
              <Alert
                role="status"
                className="mt-4 border-success/30 bg-success/10 text-success"
              >
                <AlertDescription className="font-medium text-success">
                  {providerState === "qwen"
                    ? t.statusQwenComplete
                    : t.statusDemoComplete}
                </AlertDescription>
              </Alert>
            ) : null}
            {stage === "generated" ? (
              <Alert
                role="status"
                className="mt-4 border-success/30 bg-success/10 text-success"
              >
                <AlertDescription className="font-medium text-success">
                  {t.statusPreviewReady}
                </AlertDescription>
              </Alert>
            ) : null}

            {providerMessage && providerState === "qwen" ? (
              <Alert className="mt-4 border-success/30 bg-success/10 text-success">
                <AlertDescription className="text-success">{providerMessage}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>

        <Card className="min-w-0 border-border/80 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-2">
            {(artifact?.steps ?? flowSteps).map(
              (step, index) => (
              <div key={step.id} className="flex shrink-0 items-center gap-2">
                  <Badge
                    variant={index <= activeStepIndex ? "default" : "outline"}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs",
                      index <= activeStepIndex &&
                        "border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    {step.label}
                  </Badge>
                  {index < 5 ? (
                    <ChevronRight className="size-3 text-muted-foreground" aria-hidden />
                  ) : null}
                </div>
              ),
            )}
            </div>

          {artifact ? (
            <div className="grid gap-5">
              {showSplitView && stage !== "generated" ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.analysisOutputLabel}
                </p>
              ) : null}

              {artifact.summary ? (
                <Card className="bg-background">
                  <CardContent className="space-y-3 p-4">
                    <p className="text-sm text-muted-foreground">{artifact.summary}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => void copyShareLink()}
                      disabled={copyingShareLink}
                      data-testid="copy-share-link"
                    >
                      <Share2 className="size-3.5" aria-hidden />
                      {copyingShareLink ? t.creatingShareLink : t.copyShortShareLink}
                    </Button>
                  </CardContent>
                </Card>
              ) : null}
              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                {artifact.plan.map((section) => (
                  <Card key={section.title} className="min-w-0 bg-background">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="break-words text-sm leading-6 text-muted-foreground">
                        {section.body}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <UiLawsCompliance
                artifact={artifact}
                stage={stage === "generated" ? "generated" : "analyzed"}
              />

              {artifact.generatedCode &&
              (stage === "analyzed" || stage === "generated") ? (
                <Card className="bg-background" data-testid="scaffold-export-panel">
                  <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-3">
                    <div>
                      <CardTitle className="text-sm">{t.exportScaffold}</CardTitle>
                      <CardDescription className="text-xs">
                        {t.exportScaffoldDesc}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ExportButton
                        text={artifact.generatedCode}
                        variant="copy"
                        label={t.exportCopyAll}
                        analyticsSource="upload_flow"
                        analyticsFeature="generated_scaffold"
                        onCopied={() => toast(t.toastScaffoldCopied, "success")}
                      />
                      <ExportButton
                        text={artifact.generatedCode}
                        variant="export"
                        label={t.exportDownload}
                        filename={exportFilename}
                        analyticsSource="upload_flow"
                        analyticsFeature="generated_scaffold"
                        onCopied={() => toast(t.toastScaffoldExported, "success")}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={exportHandoffBundle}
                        data-testid="export-handoff-bundle"
                      >
                        <PackageOpen className="size-3.5" aria-hidden />
                        {t.exportHandoffBundle}
                      </Button>
                      <GistExportButton
                        text={artifact.generatedCode}
                        filename={exportFilename}
                        description="qwen-ui-lab generated scaffold"
                        analyticsSource="upload_flow"
                        analyticsFeature="generated_scaffold"
                      />
                      <RepoExportButton
                        text={artifact.generatedCode}
                        filename={exportFilename}
                        description="qwen-ui-lab generated scaffold"
                        analyticsSource="upload_flow"
                        analyticsFeature="generated_scaffold"
                      />
                    </div>
                  </CardHeader>
                  {stage === "generated" ? null : (
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">
                        {t.exportGenerateHint}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ) : null}

              {stage === "generated" ? (
                <div className="grid min-w-0 gap-5 xl:grid-cols-2">
                  <Card className="relative min-w-0 overflow-hidden">
                    <div className="p-4 pt-2">
                      <SnippetPreview
                        code={artifact.generatedCode}
                        title={t.generatedScaffold}
                        showCopy={false}
                      />
                    </div>
                  </Card>

                  <DetectionComparisonPreview
                    previewUrl={previewUrl}
                    artifact={artifact}
                    copy={t}
                    alt={
                      file
                        ? interpolate(t.uploadedReferenceAltNamed, {
                            fileName: file.name,
                          })
                        : t.uploadedReferenceAlt
                    }
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
              {t.emptyState}
            </div>
          )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unable to read image as data URL."));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function cloneDetections(
  detections: UiFlowArtifact["detections"] | null | undefined,
) {
  if (!detections) return null;
  return JSON.parse(JSON.stringify(detections)) as UiFlowArtifact["detections"];
}

function currentTimestamp() {
  return Date.now();
}
