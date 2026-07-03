"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import Image from "next/image";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import {
  Archive,
  Check,
  ChevronDown,
  CircleAlert,
  Download,
  Eye,
  EyeOff,
  FileCode2,
  FileText,
  Grid2X2,
  ListChecks,
  Loader2,
  PackageOpen,
  PackageCheck,
  Redo2,
  RotateCcw,
  Share2,
  Sparkles,
  Tags,
  Undo2,
  X,
} from "lucide-react";
import { ExportButton } from "@/features/export/components/ExportButton";
import { GistExportButton } from "@/features/export/components/GistExportButton";
import { RepoExportButton } from "@/features/export/components/RepoExportButton";
import { SharedSummaryCard } from "@/features/share/components/SharedSummaryCard";
import { SamplePicker } from "./SamplePicker";
import { UploadDropzone } from "./UploadDropzone";
import { WorkflowStepper } from "./WorkflowStepper";
import { normalizeReviewStatusLabel } from "@/lib/product-labels.mjs";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DialogActionFooter,
  DialogActionGroup,
} from "@/components/ui/dialog-action-footer";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { ResponsiveTabsList } from "@/components/ui/responsive-tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import {
  detectionElementLabel,
  detectionKindLabel,
  primitiveForDetectionKind,
} from "@/lib/detection-labels";
import { cn } from "@/lib/utils";
import { downloadTextFile } from "@/lib/clipboard.client";
import { useObservability } from "@/components/providers/ObservabilityProvider";
import { useProviderMode } from "@/components/providers/ProviderModeProvider";
import {
  buildAnalyzeFailureError,
  isReportableAnalyzeFailure,
} from "../lib/analyze-observability.mjs";
import {
  buildDesignMarkdown,
  DESIGN_MD_FILENAME,
} from "../lib/design-md.mjs";
import {
  correctedDetectionConfidence,
  describeManualDetectionChanges,
  mergeManualCorrectionReasons,
} from "../lib/detection-corrections.mjs";
import { AnalyticsEvent, AnalyticsStatus, createAnalyticsClient } from "@/lib/analytics.client";
import { createExperimentConfig, resolveExperimentVariant } from "@/lib/experiments";
import {
  SAMPLE_RUNS,
  findSampleRunByFileName,
  getSampleRunById,
  sampleRunExportFilename,
} from "../lib/reference-samples.mjs";
import { getSampleCopy } from "../lib/sample-copy";
import {
  getCurrentFlowStepIndex,
  shouldShowWorkflowOutput,
  type UploadFlowStage,
  type UploadProviderState,
} from "../lib/upload-flow-progress";
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
  componentRole?: string;
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

type ExportPackageFile = {
  path: string;
  label: string;
  description: string;
};

type ExportPackagePreview = {
  componentName: string;
  fileCount: number;
  files: ExportPackageFile[];
  metrics: Array<{ label: string; value: string }>;
  changes: string[];
  correctionNotice: string | null;
  readmePreview: string;
  codePreview: string;
};

type DetectionChangeOptions = {
  recordHistory?: boolean;
};

type Stage = UploadFlowStage;
type ProviderState = UploadProviderState;

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
  "Preparing analysis…",
  "Analyzing layout…",
  "Preparing preview…",
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

function isEditablePasteTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      'input,textarea,select,[contenteditable="true"],[role="textbox"]',
    ),
  );
}

function pastedImageFileFromClipboard(data: DataTransfer | null) {
  if (!data) return null;
  const files = [...data.files];
  const directFile = files.find((file) => file.type.startsWith("image/"));
  if (directFile) return normalizePastedImageFile(directFile);

  const item = [...data.items].find(
    (entry) => entry.kind === "file" && entry.type.startsWith("image/"),
  );
  const itemFile = item?.getAsFile();
  return itemFile ? normalizePastedImageFile(itemFile) : null;
}

function normalizePastedImageFile(file: File) {
  if (file.name) return file;
  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
  return new File([file], `pasted-screenshot.${extension}`, {
    type: file.type || "image/png",
    lastModified: Date.now(),
  });
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
  const [boxLabelsVisible, setBoxLabelsVisible] = useState(false);
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
          ? buildEditedDetectionElement(element, patch)
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
                  "pointer-events-auto absolute cursor-move rounded-[3px] border bg-background/15 text-left shadow-[0_0_0_1px_rgb(255_255_255_/_0.55)] transition focus-visible:z-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  detectionClassName(element.kind),
                  element.included === false && "border-dashed opacity-35",
                  selectedElement?.id === element.id &&
                    "z-20 ring-2 ring-foreground",
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
                data-primitive={element.primitive ?? primitiveForDetectionKind(element.kind)}
                data-confidence={element.confidence}
                data-box={`${element.box.x},${element.box.y},${element.box.width},${element.box.height}`}
                aria-label={`Select ${element.kind}`}
                onClick={() => setSelectedElementId(element.id)}
                onFocus={() => setSelectedElementId(element.id)}
                onKeyDown={(event) => handleDetectionBoxKeyDown(event, element)}
                onPointerDown={(event) => startBoxInteraction(event, element, "move")}
              >
                <span
                  className={cn(
                    "pointer-events-none absolute left-0 top-0 max-w-full truncate rounded-br-[3px] bg-background/90 px-1 py-0.5 text-[10px] font-medium leading-none text-foreground shadow-sm",
                    selectedElement?.id === element.id ? "block" : "hidden sm:block",
                  )}
                >
                  {detectionKindLabel(element.kind)} - {Math.round(element.confidence * 100)}%
                </span>
                {boxLabelsVisible ? (
                  <span
                    className="pointer-events-none absolute bottom-0 left-0 max-w-[calc(100%-1rem)] truncate rounded-tr-[3px] bg-background/90 px-1 py-0.5 text-[9px] font-mono leading-none text-muted-foreground shadow-sm"
                    data-testid="detection-box-label"
                  >
                    {element.primitive ?? primitiveForDetectionKind(element.kind)}{" "}
                    {Math.round(element.box.x)},{Math.round(element.box.y)}{" "}
                    {Math.round(element.box.width)}x{Math.round(element.box.height)}
                  </span>
                ) : null}
                <span
                  className="absolute bottom-0 right-0 z-30 size-5 cursor-se-resize rounded-tl-[3px] border-l border-t border-background/70 bg-foreground/80 sm:size-4"
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
          <CardContent className="space-y-4 p-4">
            <div className="grid gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Detection review
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Adjust boxes before regenerating. Your updates guide the next preview.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={qualityStats.reviewCount ? "destructive" : "secondary"}>
                  {qualityStats.reviewCount} review
                </Badge>
                <Badge variant="outline">{qualityStats.editedCount} updated</Badge>
                <Badge variant="outline">{qualityStats.excludedCount} hidden</Badge>
                <Badge
                  variant="secondary"
                  data-testid="visual-diff-score"
                  data-visual-method={qualityStats.visualMethod}
                >
                  {qualityStats.visualScore}% visual match
                </Badge>
              </div>
            </div>

            <div className="grid gap-2 rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Box tools
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={boxLabelsVisible ? "secondary" : "outline"}
                  size="sm"
                  className="min-h-10 gap-2"
                  onClick={() => setBoxLabelsVisible((value) => !value)}
                  aria-pressed={boxLabelsVisible}
                  data-testid="toggle-box-labels"
                >
                  <Tags className="size-3.5" aria-hidden />
                  Box labels
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-10 gap-2"
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
                  className="min-h-10 gap-2"
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
                  className="min-h-10 gap-2"
                  onClick={onSnapDetections}
                  data-testid="snap-detections-grid"
                >
                  <Grid2X2 className="size-3.5" aria-hidden />
                  Snap to grid
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-10 gap-2"
                  onClick={onExportDetections}
                  data-testid="export-detections-json"
                >
                  <Download className="size-3.5" aria-hidden />
                  Download detections
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {selectedElement ? (
        <Card className="bg-background" data-testid="detection-details">
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Selected element
                </p>
                <p className="mt-1 text-sm font-medium text-card-foreground">
                  {detectionElementLabel(selectedElement)} -{" "}
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
                    primitive: primitiveForDetectionKind(event.target.value),
                  })
                }
                className="min-h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                data-testid="detection-kind-select"
              >
                {DETECTION_KIND_OPTIONS.map((kind) => (
                  <option key={kind} value={kind}>
                    {detectionKindLabel(kind)}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-2 rounded-lg border border-border/70 bg-muted/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Confidence reasons
                </p>
                <Badge variant="outline">
                  {(selectedElement.reasons ?? []).length} signals
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(selectedElement.reasons ?? []).slice(0, 4).map((reason) => (
                  <Badge key={reason.code} variant="outline" className="max-w-full bg-background">
                    <span className="truncate">{reason.label}</span>
                  </Badge>
                ))}
              </div>
              <ul className="space-y-1 text-xs leading-5 text-muted-foreground">
                {(selectedElement.reasons ?? []).slice(0, 3).map((reason) => (
                  <li key={reason.code}>{reason.evidence}</li>
                ))}
              </ul>
            </div>

            {boxLabelsVisible ? (
              <div
                className="grid gap-2 rounded-md border border-border bg-muted/30 p-3 text-xs"
                data-testid="detection-box-metadata-panel"
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <BoxMetadataField label="Element ID" value={selectedElement.id} />
                  <BoxMetadataField
                    label="Primitive"
                    value={selectedElement.primitive ?? primitiveForDetectionKind(selectedElement.kind)}
                  />
                  <BoxMetadataField
                    label="Geometry"
                    value={`${selectedElement.box.x}, ${selectedElement.box.y}, ${selectedElement.box.width}x${selectedElement.box.height}`}
                  />
                  <BoxMetadataField
                    label="Confidence"
                    value={`${Math.round(selectedElement.confidence * 100)}%`}
                  />
                  <BoxMetadataField
                    label="Included"
                    value={selectedElement.included === false ? "false" : "true"}
                  />
                  <BoxMetadataField
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

function BoxMetadataField({ label, value }: { label: string; value: string }) {
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
    const primitive = element.primitive ?? primitiveForDetectionKind(element.kind);
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

function buildEditedDetectionElement(
  element: DetectionElement,
  patch: Partial<DetectionElement>,
): DetectionElement {
  const nextIncluded = patch.included ?? element.included ?? true;
  const primitive =
    patch.primitive ??
    (patch.kind ? primitiveForDetectionKind(patch.kind) : element.primitive ?? primitiveForDetectionKind(element.kind));
  const componentRole =
    patch.componentRole ??
    (patch.primitive || patch.kind
      ? primitive
      : element.componentRole ?? primitive);
  const nextConfidence = correctedDetectionConfidence(
    patch.confidence ?? element.confidence,
    nextIncluded !== false,
  );

  return {
    ...element,
    ...patch,
    primitive,
    componentRole,
    confidence: nextConfidence,
    userEdited: true,
    reasons: mergeEditedDetectionReasons(
      element.reasons,
      nextIncluded !== false,
      nextConfidence,
      describeManualDetectionChanges(element, { ...patch, primitive }),
    ),
  };
}

function mergeEditedDetectionReasons(
  reasons: DetectionReason[] | undefined,
  included: boolean,
  confidence: number,
  changes: string[] = [],
) {
  return mergeManualCorrectionReasons({
    reasons,
    included,
    confidence,
    changes,
    source: "editor",
  }) as DetectionReason[];
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

function buildExportPackagePreview(
  artifact: UiFlowArtifact,
  exportFilename: string,
  copy: UploadFlowDictionary,
): ExportPackagePreview {
  const generatedCode = artifact.generatedCode ?? "";
  const componentName = inferStarterComponentName(generatedCode);
  const stem = toExportStem(exportFilename);
  const detectedElements =
    asArray(readGeneratedJsonConst(generatedCode, "detectedElements")) ??
    artifact.detections?.elements ??
    [];
  const layoutRegions =
    asArray(readGeneratedJsonConst(generatedCode, "layoutRegions")) ?? [];
  const detectedPatterns = asRecord(readGeneratedJsonConst(generatedCode, "detectedPatterns"));
  const responsiveIntent = asRecord(readGeneratedJsonConst(generatedCode, "responsiveIntent"));
  const screenIntent = asRecord(readGeneratedJsonConst(generatedCode, "screenIntent"));
  const primitiveMap = asRecord(readGeneratedJsonConst(generatedCode, "shadcnPrimitiveMap"));
  const designTokens = asRecord(readGeneratedJsonConst(generatedCode, "designTokens"));
  const activeDetections =
    artifact.detections?.elements.filter((element) => element.included !== false) ?? [];
  const editedCount =
    artifact.detections?.elements.filter((element) => element.userEdited).length ?? 0;
  const excludedCount = Math.max(
    0,
    (artifact.detections?.elements.length ?? 0) - activeDetections.length,
  );
  const correctionSummary =
    editedCount || excludedCount
      ? interpolate(copy.exportChangeCorrections, {
          edited: String(editedCount),
          excluded: String(excludedCount),
        })
      : copy.exportReadmeNoCorrections;
  const elementCount = detectedElements.length || activeDetections.length;
  const lowConfidenceCount = (detectedElements.length ? detectedElements : activeDetections).filter(
    (element) => numericRecordValue(element, "confidence") < 0.75,
  ).length;
  const reviewSummary = lowConfidenceCount
    ? interpolate(copy.exportReadmeReviewSummary, {
        count: String(lowConfidenceCount),
      })
    : copy.exportReadmeReviewClear;
  const regionCount = layoutRegions.length || artifact.plan.length;
  const primitiveCount =
    Object.keys(primitiveMap).length ||
    new Set(activeDetections.map((element) => element.primitive ?? primitiveForDetectionKind(element.kind)))
      .size;
  const patternCount = countDetectedPatternGroups(detectedPatterns);
  const breakpoints = asStringArray(responsiveIntent.breakpoints);
  const responsiveMode = stringValue(responsiveIntent.mode, "responsive layout");
  const intentLabel = stringValue(screenIntent.label, artifact.modeLabel ?? "Starter screen");
  const tokenCount = Object.keys(designTokens).length;
  const files: ExportPackageFile[] = [
    {
      path: "README.md",
      label: "Start here",
      description: "Plain-language install notes and review checklist.",
    },
    {
      path: "DESIGN.md",
      label: "Design notes",
      description: "Layout decisions, responsive assumptions, primitive mapping, and review notes.",
    },
    {
      path: `src/components/starters/${stem}.tsx`,
      label: "Component",
      description: `${componentName} with React, Tailwind, and shadcn-style primitives.`,
    },
    {
      path: `src/components/starters/${stem}.recipe.json`,
      label: "Recipe",
      description: "Primitive map, review updates, and settings for rebuilding the component.",
    },
    {
      path: `src/components/starters/${stem}.manifest.json`,
      label: "Manifest",
      description: "Package identity, dependencies, quality gates, and safety metadata.",
    },
    {
      path: `src/components/starters/${stem}.tokens.css`,
      label: "Tokens",
      description: "CSS variables derived from the screenshot palette.",
    },
    {
      path: `docs/${stem}.detection.md`,
      label: "Detection notes",
      description: "Human-readable summary of regions, confidence, and integration work.",
    },
  ];

  const changes = [
    interpolate(copy.exportChangeRegions, {
      count: String(regionCount),
      intent: intentLabel,
    }),
    interpolate(copy.exportChangePrimitives, {
      count: String(primitiveCount),
      elements: String(elementCount),
    }),
    interpolate(copy.exportChangeResponsive, {
      mode: responsiveMode,
      breakpoints: breakpoints.join(", ") || "base",
    }),
    interpolate(copy.exportChangePackage, {
      count: String(files.length),
    }),
  ];

  if (editedCount || excludedCount) {
    changes.splice(
      2,
      0,
      interpolate(copy.exportChangeCorrections, {
        edited: String(editedCount),
        excluded: String(excludedCount),
      }),
    );
  }
  if (patternCount) {
    changes.splice(
      2,
      0,
      interpolate(copy.exportChangePatterns, {
        count: String(patternCount),
      }),
    );
  }

  const metrics = [
    { label: copy.exportMetricFiles, value: String(files.length) },
    { label: copy.exportMetricRegions, value: String(regionCount) },
    { label: copy.exportMetricPrimitives, value: String(primitiveCount) },
    ...(editedCount || excludedCount
      ? [
          { label: copy.exportMetricEdits, value: String(editedCount) },
          { label: copy.exportMetricExcluded, value: String(excludedCount) },
        ]
      : []),
    { label: copy.exportMetricTokens, value: String(tokenCount || 0) },
  ];

  return {
    componentName,
    fileCount: files.length,
    files,
    metrics,
    changes,
    correctionNotice: editedCount || excludedCount ? correctionSummary : null,
    readmePreview: buildExportReadmePreview({
      copy,
      componentName,
      files,
      intentLabel,
      responsiveMode,
      correctionSummary,
      reviewSummary,
    }),
    codePreview: generatedCode,
  };
}

function buildExportReadmePreview({
  copy,
  componentName,
  files,
  intentLabel,
  responsiveMode,
  correctionSummary,
  reviewSummary,
}: {
  copy: UploadFlowDictionary;
  componentName: string;
  files: ExportPackageFile[];
  intentLabel: string;
  responsiveMode: string;
  correctionSummary: string;
  reviewSummary: string;
}) {
  return [
    "# Screenshot-to-React starter package",
    "",
    `${copy.exportReadmeIntent}: ${intentLabel}`,
    `${copy.exportReadmeComponent}: ${componentName}`,
    `${copy.exportReadmeResponsive}: ${responsiveMode}`,
    `${copy.exportReadmeCorrections}: ${correctionSummary}`,
    `${copy.exportReadmeReviewNotes}: ${reviewSummary}`,
    "",
    `## ${copy.exportReadmeContains}`,
    "",
    ...files.map((file) => `- ${file.path} - ${file.description}`),
    "",
    `## ${copy.exportReadmeNext}`,
    "",
    "1. Review detection notes before deleting or merging regions.",
    "2. Replace starter content with product data.",
    "3. Run lint/build after placing the starter component.",
  ].join("\n");
}

function inferStarterComponentName(code: string) {
  return (
    /export\s+default\s+function\s+([A-Za-z0-9_]+)/.exec(code)?.[1] ??
    /export\s+function\s+([A-Za-z0-9_]+)/.exec(code)?.[1] ??
    "StarterComponent"
  );
}

function toExportStem(filename: string) {
  return (
    filename
      .replace(/\.[^.]+$/, "")
      .replace(/[^\w.-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "starter-component"
  );
}

function readGeneratedJsonConst(source: string, name: string) {
  const declaration = new RegExp(`const\\s+${name}(?:\\s*:\\s*[^=]+)?\\s*=\\s*`).exec(
    source,
  );
  if (!declaration) return null;

  const start = declaration.index + declaration[0].length;
  const literal = readBalancedJsonLiteral(source, start);
  if (!literal) return null;

  try {
    return JSON.parse(literal);
  } catch {
    try {
      return JSON.parse(literal.replace(/,\s*([}\]])/g, "$1"));
    } catch {
      return null;
    }
  }
}

function readBalancedJsonLiteral(source: string, start: number) {
  const opening = source[start];
  const closing = opening === "{" ? "}" : opening === "[" ? "]" : null;
  if (!closing) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === opening) depth += 1;
    if (char === closing) {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  return null;
}

function asArray(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function countDetectedPatternGroups(patterns: Record<string, unknown>) {
  return Object.values(patterns).reduce<number>((count, value) => {
    if (Array.isArray(value)) return count + value.length;
    return count;
  }, 0);
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function numericRecordValue(value: unknown, key: string, fallback = 1) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }
  const nextValue = (value as Record<string, unknown>)[key];
  return typeof nextValue === "number" && Number.isFinite(nextValue)
    ? nextValue
    : fallback;
}

function userFacingModeLabel(
  modeLabel: string | null | undefined,
  copy: UploadFlowDictionary,
) {
  return normalizeReviewStatusLabel(modeLabel, {
    fallback: copy.modeLocalReady,
    ready: copy.modeReviewReady,
  });
}

function ExportPackageSummary({
  preview,
  copy,
}: {
  preview: ExportPackagePreview;
  copy: UploadFlowDictionary;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/30 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <PackageCheck className="size-3.5" aria-hidden />
            {copy.exportPackageReady}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {preview.componentName}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {copy.exportPackageReadyDesc}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {preview.metrics.map((metric) => (
          <div
            key={metric.label}
            className="min-w-20 rounded-lg border border-border/70 bg-background px-3 py-2"
          >
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {metric.label}
            </dt>
            <dd className="text-base font-semibold text-foreground">
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ExportPackageReviewDialog({
  preview,
  copy,
  artifact,
  exportFilename,
  onExportDesignMarkdown,
  onExported,
}: {
  preview: ExportPackagePreview;
  copy: UploadFlowDictionary;
  artifact: UiFlowArtifact;
  exportFilename: string;
  onExportDesignMarkdown: () => void;
  onExported: (message: string) => void;
}) {
  return (
    <Dialog>
      <DialogTrigger
        type="button"
        aria-haspopup="dialog"
        data-testid="export-package-review"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border/80 bg-background px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Archive className="size-4" aria-hidden />
        {copy.exportReviewPackage}
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(90dvh,46rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[calc(100%-3rem)] lg:max-w-5xl">
        <DialogHeader className="border-b border-border px-5 py-4">
          <div className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <DialogTitle className="text-xl">{copy.exportPackageTitle}</DialogTitle>
              <DialogDescription className="mt-2 max-w-2xl">
                {copy.exportPackageDesc}
              </DialogDescription>
            </div>
            <Badge variant="outline" className="w-fit gap-1.5">
              <PackageOpen className="size-3.5" aria-hidden />
              {preview.fileCount} {copy.exportPackageFilesLabel}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="files" className="min-h-0 flex-1 gap-0 overflow-hidden bg-background">
          <div className="shrink-0 overflow-visible border-b border-border/60 bg-background/95 px-4 py-3.5 sm:px-5">
            <ResponsiveTabsList columns={3}>
              <TabsTrigger value="files" className="h-11 min-h-11 gap-1 px-2 text-xs sm:gap-2 sm:px-3 sm:text-sm">
                <FileCode2 className="size-4" aria-hidden />
                {copy.exportPackageFilesTab}
              </TabsTrigger>
              <TabsTrigger value="changes" className="h-11 min-h-11 gap-1 px-2 text-xs sm:gap-2 sm:px-3 sm:text-sm">
                <ListChecks className="size-4" aria-hidden />
                {copy.exportPackageChangesTab}
              </TabsTrigger>
              <TabsTrigger value="copy" className="h-11 min-h-11 gap-1 px-2 text-xs sm:gap-2 sm:px-3 sm:text-sm">
                <FileText className="size-4" aria-hidden />
                {copy.exportPackageCopyTab}
              </TabsTrigger>
            </ResponsiveTabsList>
          </div>

          <TabsContent value="files" className="min-h-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full min-h-0">
              <div className="grid gap-3 px-4 pb-5 pt-3 sm:px-5">
                <p className="text-sm leading-6 text-muted-foreground">
                  {copy.exportPackageFilesIntro}
                </p>
                <div className="grid gap-2">
                  {preview.files.map((file) => (
                    <div
                      key={file.path}
                      className="grid gap-2 rounded-xl border border-border/70 bg-muted/25 p-3 sm:grid-cols-[10rem_minmax(0,1fr)]"
                    >
                      <div>
                        <p className="font-medium text-foreground">{file.label}</p>
                        <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                          {file.path}
                        </p>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {file.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="changes" className="min-h-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full min-h-0">
              <div className="grid gap-4 px-4 pb-5 pt-3 sm:px-5">
                <p className="text-sm leading-6 text-muted-foreground">
                  {copy.exportPackageChangesIntro}
                </p>
                {preview.correctionNotice ? (
                  <Alert className="border-primary/25 bg-primary/5">
                    <ListChecks className="size-4" aria-hidden />
                    <AlertTitle>{copy.exportReadmeCorrections}</AlertTitle>
                    <AlertDescription>{preview.correctionNotice}</AlertDescription>
                  </Alert>
                ) : null}
                <ol className="grid gap-3">
                  {preview.changes.map((change, index) => (
                    <li
                      key={change}
                      className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-xl border border-border/70 bg-background p-3"
                    >
                      <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                        {index + 1}
                      </span>
                      <p className="pt-1 text-sm leading-6 text-muted-foreground">
                        {change}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="copy" className="min-h-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full min-h-0">
              <div className="grid gap-4 px-4 pb-5 pt-3 sm:px-5">
                <p className="text-sm leading-6 text-muted-foreground">
                  {copy.exportPackageCopyIntro}
                </p>
                <SnippetPreview
                  code={preview.readmePreview}
                  title="README.md"
                  language="markdown"
                  showCopy={false}
                />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogActionFooter data-testid="export-package-actions" align="between">
          <details className="group order-2 min-w-0 rounded-xl border border-border/70 bg-muted/25 p-1 sm:order-none sm:w-auto">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 text-sm font-medium text-foreground transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden">
              <span>{copy.exportMoreOptions}</span>
              <ChevronDown
                className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <DialogActionGroup className="flex-col items-stretch border-t border-border/70 px-2 py-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11 gap-2 sm:w-auto"
                onClick={onExportDesignMarkdown}
                data-testid="export-design-md"
              >
                <FileText className="size-4" aria-hidden />
                {copy.exportDesignDoc}
              </Button>
              <GistExportButton
                text={artifact.generatedCode}
                filename={exportFilename}
                description="Screenshot-to-React starter package"
                analyticsSource="upload_flow"
                analyticsFeature="starter_component"
                className="sm:w-auto"
              />
              <RepoExportButton
                text={artifact.generatedCode}
                filename={exportFilename}
                description="Screenshot-to-React starter package"
                label={copy.exportRepoInstructions}
                className="min-h-11 sm:w-auto"
                analyticsSource="upload_flow"
                analyticsFeature="starter_component"
              />
            </DialogActionGroup>
          </details>
          <DialogActionGroup className="order-1 grid w-full grid-cols-2 gap-2 sm:order-none sm:flex sm:w-auto sm:justify-end">
            <RepoExportButton
              text={artifact.generatedCode}
              filename={exportFilename}
              description="Screenshot-to-React starter package"
              label={copy.exportDownloadPackage}
              exportMode="zip"
              testId="export-package-download"
              className="order-first col-span-2 min-h-11 w-full border-primary/70 bg-primary text-primary-foreground hover:bg-primary/90 sm:order-none sm:w-auto"
              analyticsSource="upload_flow"
              analyticsFeature="export_package"
              onExported={() => onExported(copy.toastPackageDownloaded)}
            />
            <ExportButton
              text={preview.codePreview}
              variant="copy"
              label={copy.exportCopyAll}
              className="w-full sm:w-auto"
              showToast={false}
              analyticsSource="upload_flow"
              analyticsFeature="starter_component"
              onCopied={() => onExported(copy.toastScaffoldCopied)}
            />
            <ExportButton
              text={preview.codePreview}
              variant="export"
              label={copy.exportDownload}
              filename={exportFilename}
              className="w-full sm:w-auto"
              showToast={false}
              analyticsSource="upload_flow"
              analyticsFeature="starter_component"
              onCopied={() => onExported(copy.toastScaffoldExported)}
            />
          </DialogActionGroup>
        </DialogActionFooter>
      </DialogContent>
    </Dialog>
  );
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
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{copy.livePreview}</CardTitle>
        <CardDescription className="text-xs">
          {copy.comparisonPreviewDesc}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 pt-0">
        <div className="grid min-w-0 gap-3 lg:grid-cols-2">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.comparisonScreenshot}
            </p>
            <div className="relative h-56 overflow-hidden rounded-md border border-border sm:h-72">
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
              {copy.comparisonGeneratedPreview}
            </p>
            <div
              className="relative h-56 overflow-hidden rounded-md border sm:h-72"
              data-testid="generated-preview-canvas"
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
                  data-testid="generated-preview-element"
                  data-detection-id={element.id}
                  data-kind={element.kind}
                  data-primitive={element.primitive ?? primitiveForDetectionKind(element.kind)}
                >
                  <StarterPreviewPrimitive element={element} tokens={tokens} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-4">
          {artifact.previewStats.map((stat) => (
            <div
              key={stat.label}
              className="min-w-0 rounded-lg border border-border/70 bg-muted/20 px-3 py-2"
            >
              <div className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </div>
              <div className="mt-1 text-lg font-semibold text-card-foreground">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StarterPreviewPrimitive({
  element,
  tokens,
}: {
  element: DetectionElement;
  tokens: ReturnType<typeof detectionPreviewTokens>;
}) {
  const primitive = element.primitive ?? primitiveForDetectionKind(element.kind);
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
  /** Guided layout id (dashboard, auth, mobile, etc.) for the sample-run route. */
  sampleRunId?: string;
  /** Load sample + run analyze on mount (sample route) */
  autoRunSample?: boolean;
}

export function UploadFlow({
  sampleRunId,
  autoRunSample = false,
}: UploadFlowProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, dict } = useLocale();
  const t = dict.uploadFlow;
  const observability = useObservability();
  const { mode } = useProviderMode();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropzoneButtonRef = useRef<HTMLButtonElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const originalDetectionsRef = useRef<UiFlowArtifact["detections"] | null>(null);
  const detectionHistoryRef = useRef<NonNullable<UiFlowArtifact["detections"]>[]>([]);
  const detectionHistoryIndexRef = useRef(-1);
  const sampleBootstrappedRef = useRef<string | null>(null);
  const loadSampleRunRef = useRef<(sampleId: string) => Promise<void>>(
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
  const [loadingSample, setLoadingSample] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState(
    SAMPLE_RUNS[0]?.id ?? "dashboard",
  );
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
    sampleRun?: boolean;
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
      if (shortLink?.url && shortLink.durable) {
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
      const hashUrl = buildShareUrl(window.location.origin, "/share/local", payload);
      const url = shortLink?.durable ? shortLink.url : hashUrl;
      await navigator.clipboard.writeText(url);
      if (shortLink?.durable) {
        window.history.replaceState(null, "", shortLink.url);
      } else {
        window.history.replaceState(null, "", `${pathname}#${encodeShareHash(payload)}`);
      }
      toast(
        shortLink?.durable
          ? t.toastShortShareCopied
          : t.toastShareHashCopied,
        "success",
      );
    } catch {
      toast(t.toastShareFailed, "error");
    } finally {
      setCopyingShareLink(false);
    }
  }

  const showSampleScreenshotButton =
    !sampleUsed && !userUploadedOwn && !file;

  const currentFlowStepIndex = useMemo(
    () => getCurrentFlowStepIndex(stage, providerState),
    [providerState, stage],
  );

  const showSplitView = stage === "analyzed" || stage === "generated";
  const showWorkflowOutput = shouldShowWorkflowOutput({
    hasArtifact: Boolean(artifact),
    hasFile: Boolean(file),
    providerState,
  });

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
      const sampleRun = findSampleRunByFileName(file.name);
      if (sampleRun) {
        return sampleRunExportFilename(sampleRun.id);
      }

      const base = file.name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-");
      return `starter-${base || "component"}.tsx`;
    }
    if (sampleRunId) {
      return sampleRunExportFilename(sampleRunId);
    }
    return "starter-component.tsx";
  }, [sampleRunId, file]);

  const exportPackagePreview = useMemo(
    () =>
      artifact?.generatedCode
        ? buildExportPackagePreview(artifact, exportFilename, t)
        : null,
    [artifact, exportFilename, t],
  );

  const resetDetectionHistory = useCallback(
    (detections: UiFlowArtifact["detections"] | null) => {
      const cloned = cloneDetections(detections);
      detectionHistoryRef.current = cloned ? [cloned] : [];
      detectionHistoryIndexRef.current = cloned ? 0 : -1;
      setDetectionHistoryState({
        index: detectionHistoryIndexRef.current,
        length: detectionHistoryRef.current.length,
      });
    },
    [],
  );

  const acceptFile = useCallback((
    nextFile: File | null,
    source: "dropzone" | "sample" = "dropzone",
  ) => {
    setError(null);
    setArtifact(null);
    setProviderState("idle");
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
  }, [analytics, resetDetectionHistory, t]);
  useEffect(() => {
    function focusDropzone() {
      const button = dropzoneButtonRef.current;
      if (!button) return;
      button.focus({ preventScroll: true });
      button.scrollIntoView({ block: "center", behavior: "smooth" });
    }

    function onPaste(event: ClipboardEvent) {
      if (isBusy || isEditablePasteTarget(event.target)) return;
      const pastedFile = pastedImageFileFromClipboard(event.clipboardData);
      if (!pastedFile) return;

      event.preventDefault();
      focusDropzone();
      acceptFile(pastedFile, "dropzone");
      window.requestAnimationFrame(focusDropzone);
    }

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [acceptFile, isBusy]);

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
      setStage("analyzed");
      reportAnalyzeFailure(outcome);

      const record: SessionRecord = {
        id: crypto.randomUUID(),
        timestamp: currentTimestamp(),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        modeLabel: userFacingModeLabel(nextArtifact.modeLabel, t),
        providerState: outcome.providerState as "qwen" | "fallback",
        savedBy: savedByLabel,
        summary: nextArtifact.summary,
        artifact: {
          plan: nextArtifact.plan,
          previewStats: nextArtifact.previewStats,
          generatedCode: nextArtifact.generatedCode,
          modeLabel: userFacingModeLabel(nextArtifact.modeLabel, t),
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

      if (outcome.sampleRun) {
        toast(t.toastAnalysisReady, "success");
      } else if (outcome.providerState === "qwen") {
        toast(t.toastQwenComplete, "success");
      } else {
        toast(t.toastFallback, "default");
      }
      analytics.track(AnalyticsEvent.AnalyzeCompleted, {
        source: "upload_flow",
        providerState: String(outcome.providerState ?? "unknown"),
        fileType: file.type || "unknown",
        fileSize: file.size,
        step: "analyze",
        status: outcome.sampleRun ? AnalyticsStatus.SampleRun : AnalyticsStatus.Completed,
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
      setStage("analyzed");
      reportAnalyzeFailure(outcome);
      toast(t.toastAnalyzeFailed, "default");
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

  function exportDesignMarkdown() {
    if (!artifact || typeof document === "undefined") return;
    const designMarkdown = buildDesignMarkdown({
      artifact,
      componentFilename: exportFilename,
      exportedAt: new Date(currentTimestamp()).toISOString(),
    });
    downloadTextFile(
      designMarkdown,
      DESIGN_MD_FILENAME,
      "text/markdown;charset=utf-8",
    );
    analytics.track(AnalyticsEvent.ExportTriggered, {
      source: "upload_flow",
      feature: "design_md",
      trigger: "export",
      status: "success",
    });
    toast(t.toastDesignDocExported, "success");
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
        modeLabel: userFacingModeLabel(nextArtifact.modeLabel, t),
        providerState: providerState === "qwen" ? "qwen" : "fallback",
        savedBy: savedByLabel,
        summary: nextArtifact.summary,
        artifact: {
          plan: nextArtifact.plan,
          previewStats: nextArtifact.previewStats,
          generatedCode: nextArtifact.generatedCode,
          modeLabel: userFacingModeLabel(nextArtifact.modeLabel, t),
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

  async function loadSampleRun(sampleId: string) {
    const sample =
      SAMPLE_RUNS.find((entry) => entry.id === sampleId) ??
      getSampleRunById(sampleId);

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
      toast(
        interpolate(t.toastSampleLoaded, {
          label: getSampleCopy(sample.id, t).label,
        }),
        "success",
      );
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
    loadSampleRunRef.current = loadSampleRun;
    runPrimaryActionRef.current = runPrimaryAction;
  });

  useEffect(() => {
    if (!autoRunSample) return;

    const sampleId = sampleRunId ?? "dashboard";
    if (sampleBootstrappedRef.current === sampleId) return;
    sampleBootstrappedRef.current = sampleId;

    void (async () => {
      await loadSampleRunRef.current(sampleId);
    })();
  }, [autoRunSample, sampleRunId]);

  useEffect(() => {
    if (!autoRunSample || !file || stage !== "uploaded" || providerState === "loading") {
      return;
    }
    void runPrimaryActionRef.current();
  }, [autoRunSample, file, providerState, stage]);

  return (
    <PageContainer
      as="section"
      id="upload-flow"
      lang={locale}
      className="scroll-mt-20 py-8"
    >
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
          className="px-3 py-2 text-sm"
        >
          {providerState === "loading"
            ? t.ctaAnalyzing
            : userFacingModeLabel(artifact?.modeLabel, t)}
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

      <div
        className={cn(
          "grid min-w-0 gap-6",
          showWorkflowOutput
            ? "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
            : "w-full",
        )}
      >
        <Card className="min-w-0 border-border/80 shadow-sm">
          <CardContent className="p-6">
            {!showSplitView ? (
              <UploadDropzone
                previewUrl={previewUrl}
                onFile={acceptFile}
                inputRef={inputRef}
                buttonRef={dropzoneButtonRef}
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
              <Alert
                variant="destructive"
                className="mt-4 border-destructive/35 bg-destructive/10 shadow-sm"
              >
                <CircleAlert className="size-4" aria-hidden />
                <AlertTitle>{t.failureTitle}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {showSampleScreenshotButton ? (
                <SamplePicker
                  copy={t}
                  disabled={isBusy}
                  loading={loadingSample}
                  onLoadSample={(sampleId) => void loadSampleRun(sampleId)}
                  onSelectedSampleChange={setSelectedSampleId}
                  selectedSampleId={selectedSampleId}
                  showPathHint={samplePathHintVariant === "show-path-hint"}
                />
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
              <Card
                className="mt-4 border-primary/20 bg-primary/5 shadow-sm"
                role="status"
                aria-live="polite"
              >
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background text-primary shadow-sm ring-1 ring-primary/20">
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-card-foreground">
                        {t.loadingTitle}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {t.loadingBody}
                      </p>
                    </div>
                  </div>
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
                className="mt-4 border-success/30 bg-success/10 text-success shadow-sm"
              >
                <Check className="size-4" aria-hidden />
                <AlertTitle>{t.progressComplete}</AlertTitle>
                <AlertDescription className="font-medium text-success">
                  {providerState === "qwen"
                    ? t.statusQwenComplete
                    : t.statusAnalysisComplete}
                </AlertDescription>
              </Alert>
            ) : null}
            {stage === "generated" ? (
              <Alert
                role="status"
                className="mt-4 border-success/30 bg-success/10 text-success shadow-sm"
              >
                <Check className="size-4" aria-hidden />
                <AlertTitle>{t.progressComplete}</AlertTitle>
                <AlertDescription className="font-medium text-success">
                  {t.statusPreviewReady}
                </AlertDescription>
              </Alert>
            ) : null}

          </CardContent>
        </Card>

        {showWorkflowOutput ? (
          <Card
            className="min-w-0 border-border/80 shadow-sm"
            data-testid="workflow-output-panel"
          >
            <CardContent className="p-6">
              <WorkflowStepper
                ariaLabel={t.progressStepsAria}
                currentStepIndex={currentFlowStepIndex}
                steps={artifact?.steps ?? flowSteps}
              />

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
                      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-3">
                        <div>
                          <CardTitle className="text-sm">{t.exportScaffold}</CardTitle>
                          <CardDescription className="text-xs">
                            {t.exportScaffoldDesc}
                          </CardDescription>
                        </div>
                        {exportPackagePreview ? (
                          <ExportPackageReviewDialog
                            preview={exportPackagePreview}
                            copy={t}
                            artifact={artifact}
                            exportFilename={exportFilename}
                            onExportDesignMarkdown={exportDesignMarkdown}
                            onExported={(message) => toast(message, "success")}
                          />
                        ) : null}
                      </CardHeader>
                      <CardContent className="grid gap-4 pt-0">
                        {exportPackagePreview ? (
                          <ExportPackageSummary preview={exportPackagePreview} copy={t} />
                        ) : null}
                        {stage === "generated" ? null : (
                          <p className="text-xs text-muted-foreground">
                            {t.exportGenerateHint}
                          </p>
                        )}
                      </CardContent>
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
              ) : null}
            </CardContent>
          </Card>
        ) : null}
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

