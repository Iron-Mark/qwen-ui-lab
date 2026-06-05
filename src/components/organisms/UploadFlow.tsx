"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import Image from "next/image";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Share2,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { ExportButton } from "@/components/atoms/ExportButton";
import { GistExportButton } from "@/components/atoms/GistExportButton";
import { SharedSummaryCard } from "@/components/molecules/SharedSummaryCard";
import { UploadDropzone } from "@/components/molecules/UploadDropzone";
import { useToast } from "@/components/providers/Toast";
import {
  loadSessionHistory,
  saveSession,
  removeSession,
  type SessionRecord,
} from "@/lib/session-history";
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
import { useObservability } from "@/components/providers/ObservabilityProvider";
import { useProviderMode } from "@/lib/provider-mode";
import { AnalyticsEvent, createAnalyticsClient } from "@/lib/analytics";
import { createExperimentConfig, resolveExperimentVariant } from "@/lib/experiments";
import { BUNDLED_REFERENCE_SAMPLES } from "@/lib/reference-samples.mjs";
import {
  demoArchetypeExportFilename,
  getDemoArchetypeSample,
} from "@/lib/demo-archetypes.mjs";
import { getReferenceSampleByFileName } from "@/lib/reference-samples.mjs";
import {
  buildShareableSummary,
  buildShareUrl,
  encodeShareHash,
  persistShareSummary,
  readShareFromLocation,
  readShareFromSession,
} from "@/lib/share-result.mjs";
import {
  getAnalyzeProgressPercent,
  getAnalyzeStepLabels,
  getFlowStepLabels,
  interpolate,
  resolveAnalyzeStepIndex,
  translateAnalyzeStep,
  useLocale,
  type UploadFlowDictionary,
} from "@/lib/i18n";

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
}

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
  postAnalyzeUi: typeof import("@/lib/analyze-outcome.mjs").postAnalyzeUi;
  preprocessImageDataUrl: typeof import("@/lib/image-preprocess.mjs").preprocessImageDataUrl;
};

let analyzeModulesPromise: Promise<AnalyzeModules> | null = null;

function loadAnalyzeModules() {
  analyzeModulesPromise ??= Promise.all([
    import("@/lib/analyze-outcome.mjs"),
    import("@/lib/image-preprocess.mjs"),
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
    import("@/components/molecules/SnippetPreview").then((mod) => ({
      default: mod.SnippetPreview,
    })),
  {
    loading: () => <Skeleton className="h-72 w-full" />,
  },
);

const UiLawsCompliance = dynamic(
  () =>
    import("@/components/organisms/UiLawsCompliance").then((mod) => ({
      default: mod.UiLawsCompliance,
    })),
  {
    loading: () => <Skeleton className="h-32 w-full" />,
  },
);

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
  const { locale, dict } = useLocale();
  const t = dict.uploadFlow;
  const observability = useObservability();
  const { mode } = useProviderMode();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const demoBootstrappedRef = useRef<string | null>(null);
  const { toast } = useToast();
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

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function rememberShareableArtifact(nextArtifact: UiFlowArtifact, fileName: string) {
    const payload = buildShareableSummary({
      summary: nextArtifact.summary,
      previewStats: nextArtifact.previewStats,
      modeLabel: nextArtifact.modeLabel,
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
        file: file?.name ?? t.defaultScreenshotName,
      }) ?? sharedSummary;
    if (!payload || typeof window === "undefined") return;

    setCopyingShareLink(true);
    try {
      persistShareSummary(payload);
      const url = buildShareUrl(window.location.origin, pathname ?? "/", payload);
      await navigator.clipboard.writeText(url);
      window.history.replaceState(null, "", `${pathname}#${encodeShareHash(payload)}`);
      toast(t.toastShareCopied, "success");
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
      const sample = getDemoArchetypeSample(
        getReferenceSampleByFileName(file.name).id,
      );
      if (sample?.id) {
        return demoArchetypeExportFilename(sample.id);
      }
    }
    if (demoArchetype) {
      return demoArchetypeExportFilename(demoArchetype);
    }
    if (file?.name) {
      const base = file.name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-");
      return `generated-${base || "scaffold"}.tsx`;
    }
    return "generated-scaffold.tsx";
  }, [demoArchetype, file?.name]);

  useEffect(() => {
    if (!autoRunDemo) return;

    const sampleId = demoArchetype ?? "dashboard";
    if (demoBootstrappedRef.current === sampleId) return;
    demoBootstrappedRef.current = sampleId;

    void (async () => {
      await loadBundledSample(sampleId);
    })();
  }, [autoRunDemo, demoArchetype]);

  useEffect(() => {
    if (!autoRunDemo || !file || stage !== "uploaded" || providerState === "loading") {
      return;
    }
    void runPrimaryAction();
  }, [autoRunDemo, file, providerState, stage]);

  function acceptFile(
    nextFile: File | null,
    source: "dropzone" | "sample" = "dropzone",
  ) {
    setError(null);
    setArtifact(null);
    setProviderState("idle");
    setProviderMessage(null);
    setProviderDetail(null);

    if (!nextFile) return;

    if (source === "dropzone") {
      setUserUploadedOwn(true);
    }
    if (!nextFile.type.startsWith("image/")) {
      setError("Upload an image file: PNG, JPG, SVG, or WebP.");
      analytics.track(AnalyticsEvent.UploadRejected, {
        source: "upload_dropzone",
        fileType: nextFile.type || "unknown",
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
      setError("Choose an image before running analysis.");
      return null;
    }

    setError(null);
    setProviderState("loading");
    setAnalyzeStep(ANALYZE_STEPS[0]);
    const startedAt = Date.now();
    analytics.track(AnalyticsEvent.AnalyzeStarted, {
      source: "upload_flow",
      fileType: file.type || "unknown",
      fileSize: file.size,
      step: "analyze",
      status: "started",
    });

    try {
      const { postAnalyzeUi, preprocessImageDataUrl } = await loadAnalyzeModules();
      setAnalyzeStep(ANALYZE_STEPS[1]);
      const rawDataUrl = await readFileAsDataUrl(file);
      const preprocessed = await preprocessImageDataUrl(rawDataUrl);

      const fileMeta = {
        name: file.name,
        type: file.type,
        size: file.size,
        width: preprocessed.width,
        height: preprocessed.height,
      };

      setAnalyzeStep(ANALYZE_STEPS[2]);
      const outcome = await postAnalyzeUi(fileMeta, preprocessed.dataUrl, {
        onProgress: (step) => setAnalyzeStep(step),
      });

      setArtifact(outcome.artifact as UiFlowArtifact);
      setProviderState(outcome.providerState as ProviderState);
      setProviderMessage(outcome.message);
      setProviderDetail(outcome.detail);
      setStage("analyzed");

      const record: SessionRecord = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        modeLabel: (outcome.artifact as UiFlowArtifact).modeLabel || "Local demo mode",
        providerState: outcome.providerState as "qwen" | "fallback",
        summary: (outcome.artifact as UiFlowArtifact).summary,
        artifact: {
          plan: (outcome.artifact as UiFlowArtifact).plan,
          previewStats: (outcome.artifact as UiFlowArtifact).previewStats,
          generatedCode: (outcome.artifact as UiFlowArtifact).generatedCode,
          modeLabel: (outcome.artifact as UiFlowArtifact).modeLabel,
          summary: (outcome.artifact as UiFlowArtifact).summary,
        },
      };
      saveSession(record);
      setSessions(loadSessionHistory());
      const sharePayload = rememberShareableArtifact(
        outcome.artifact as UiFlowArtifact,
        file.name,
      );
      if (sharePayload) {
        setSharedSummary(sharePayload);
      }

      if (outcome.instantDemo) {
        toast("Instant offline demo analysis ready", "warning");
      } else if (outcome.providerState === "qwen") {
        toast("Qwen analysis complete", "success");
      } else {
        toast("Fell back to offline demo analysis", "warning");
      }
      analytics.track(AnalyticsEvent.AnalyzeCompleted, {
        source: "upload_flow",
        providerState: String(outcome.providerState ?? "unknown"),
        fileType: file.type || "unknown",
        fileSize: file.size,
        step: "analyze",
        status: outcome.instantDemo ? "instant_demo" : "completed",
        durationMs: Date.now() - startedAt,
      });

      return outcome.artifact as UiFlowArtifact;
    } catch {
      const { resolveAnalyzeOutcome } = await import("@/lib/analyze-outcome.mjs");
      const outcome = resolveAnalyzeOutcome({
        file: { name: file.name, type: file.type, size: file.size },
        fetchError: "Could not read the uploaded image.",
      });
      setArtifact(outcome.artifact as UiFlowArtifact);
      setProviderState(outcome.providerState as ProviderState);
      setProviderMessage(outcome.message);
      setProviderDetail(outcome.detail);
      setStage("analyzed");
      toast("Analysis failed — using local fallback", "error");
      analytics.track(AnalyticsEvent.AnalyzeFailed, {
        source: "upload_flow",
        providerState: String(outcome.providerState ?? "fallback"),
        fileType: file.type || "unknown",
        fileSize: file.size,
        step: "analyze",
        status: "fallback",
        durationMs: Date.now() - startedAt,
      });
      return outcome.artifact as UiFlowArtifact;
    } finally {
      setAnalyzeStep(null);
    }
  }

  async function finishPreviewGeneration(
    nextArtifact: UiFlowArtifact | null,
    toastMessage = "Preview generated",
  ) {
    if (!nextArtifact) return;
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
    await finishPreviewGeneration(nextArtifact);
  }

  async function runPrimaryAction() {
    if (!file) {
      setError("Choose an image before running analysis.");
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
      await finishPreviewGeneration(nextArtifact, "Preview regenerated");
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
      steps: [
        { id: "upload", label: "Upload" },
        { id: "analyze", label: "Analyze" },
        { id: "plan", label: "Plan" },
        { id: "generate", label: "Generate" },
        { id: "preview", label: "Preview" },
        { id: "export", label: "Export" },
      ],
      plan: record.artifact.plan,
      previewStats: record.artifact.previewStats,
      generatedCode: record.artifact.generatedCode,
      modeLabel: record.modeLabel,
      summary: record.summary,
    });
    setProviderState(record.providerState === "qwen" ? "qwen" : "fallback");
    setProviderMessage(
      record.providerState === "qwen"
        ? "Restored Qwen analysis session"
        : "Restored offline demo session",
    );
    setStage("analyzed");
    toast(`Restored session: ${record.fileName}`, "default");
  }

  function deleteSession(id: string) {
    removeSession(id);
    setSessions(loadSessionHistory());
    toast("Session removed", "default");
  }

  async function loadBundledSample(sampleId: string) {
    const sample =
      BUNDLED_REFERENCE_SAMPLES.find((entry) => entry.id === sampleId) ??
      getDemoArchetypeSample(sampleId);

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
      toast(`${sample.label} sample loaded`, "success");
      analytics.track(AnalyticsEvent.UploadSampleLoaded, {
        source: "sample_picker",
        sampleId: sample.id,
        fileType: sampleFile.type || sample.mimeType || "image/svg+xml",
        fileSize: sampleFile.size,
        step: "upload",
        status: "completed",
      });
    } catch {
      setError(
        "Could not load the sample screenshot. Upload your own image instead.",
      );
      toast("Could not load sample screenshot", "error");
    } finally {
      setLoadingSample(false);
    }
  }

  return (
    <PageContainer as="section" id="upload-flow" className="scroll-mt-20 py-8">
      {providerState === "fallback" ? (
        <Alert
          role="status"
          className="mb-4 border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100"
        >
          <AlertTitle>Offline demo mode</AlertTitle>
          <AlertDescription>
            {providerMessage} The full Upload → Analyze → Preview flow still runs
            locally for your presentation.
            {providerDetail ? (
              <span className="mt-1 block text-amber-800/80 dark:text-amber-200/80">
                Reason: {providerDetail}
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
            Live flow
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {headlineVariant === "faster-first-value"
              ? "Ship scaffold-ready UI from one screenshot"
              : "Upload screenshot to component preview"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {headlineVariant === "faster-first-value"
              ? "A faster path to conversion: upload, analyze, and export reusable React/Tailwind scaffolds in minutes."
              : "Ideal for rapid design reviews: analyze one screenshot, generate a scaffold, then reuse exported snippets across your next sprint."}
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
            (providerState === "fallback"
              ? "Local demo mode"
              : "Qwen route ready")}
        </Badge>
      </div>

      {sessions.length > 0 ? (
        <Card className="mb-6">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-3">
            <CardTitle className="text-sm">Recent analyses</CardTitle>
            <CardDescription className="text-xs">
              Stored locally (last {sessions.length})
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
                    aria-label={`Remove ${session.fileName} session`}
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
                  Uploaded reference
                </p>
                {previewUrl ? (
                  <div className="relative h-96 w-full overflow-hidden rounded-md border border-border">
                    <Image
                      src={previewUrl}
                      alt={file ? `Uploaded UI reference: ${file.name}` : "Uploaded UI reference"}
                      className="object-contain"
                      fill
                      sizes="(max-width: 1024px) 100vw, 880px"
                      loading="lazy"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex min-h-48 items-center justify-center rounded-md border border-border bg-background text-sm text-muted-foreground">
                    {artifact?.file.name ?? "Reference image"}
                  </div>
                )}
              </div>
            )}

            {file ? (
              <Card className="mt-4 bg-background">
                <CardContent className="p-4 text-sm">
                  <div className="break-words font-medium text-card-foreground">{file.name}</div>
                  <div className="mt-1 text-muted-foreground">
                    {file.type || "unknown type"} · {artifact?.file.readableSize ?? "ready"}
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
                    Try a bundled reference
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {BUNDLED_REFERENCE_SAMPLES.map((sample) => (
                      <Button
                        key={sample.id}
                        type="button"
                        variant="outline"
                        onClick={() => void loadBundledSample(sample.id)}
                        className="h-auto min-h-11 flex-col items-start gap-0.5 border-dashed px-3 py-2 text-left"
                        disabled={isBusy}
                        aria-label={`Load ${sample.label} sample`}
                      >
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                          <UploadCloud className="size-3.5 shrink-0" aria-hidden />
                          {loadingSample ? "Loading…" : sample.label}
                        </span>
                        <span className="text-[11px] font-normal text-muted-foreground">
                          {sample.hint}
                        </span>
                      </Button>
                    ))}
                  </div>
                  {samplePathHintVariant === "show-path-hint" ? (
                    <p className="text-xs text-muted-foreground">
                      New here? Pick a reference, then run analysis.
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
                      {analyzeStep ?? "Analyzing…"} ({Math.round(analyzeProgress)}%)
                    </ProgressLabel>
                  </Progress>
                  <div className="space-y-2">
                    {ANALYZE_STEPS.map((step) => (
                      <div key={step} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            analyzeStep === step
                              ? "animate-pulse bg-primary"
                              : ANALYZE_STEPS.indexOf(analyzeStep ?? "") >
                                  ANALYZE_STEPS.indexOf(step)
                                ? "bg-success"
                                : "bg-border",
                          )}
                        />
                        {step}
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
                    ? "Qwen analysis complete — open the preview to see the scaffold."
                    : "Demo analysis complete — open the preview to see the scaffold."}
                </AlertDescription>
              </Alert>
            ) : null}
            {stage === "generated" ? (
              <Alert
                role="status"
                className="mt-4 border-success/30 bg-success/10 text-success"
              >
                <AlertDescription className="font-medium text-success">
                  Preview ready — copy or export the scaffold from the panel on the right.
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
            {(artifact?.steps ?? [
              "Upload",
              "Analyze",
              "Plan",
              "Generate",
              "Preview",
              "Export",
            ].map((label) => ({ id: label.toLowerCase(), label }))).map(
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
                  Analysis output (reference on the left)
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
                      {copyingShareLink ? "Creating link…" : "Copy short share link"}
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
                      <CardTitle className="text-sm">Export scaffold</CardTitle>
                      <CardDescription className="text-xs">
                        Copy, download, or export the generated React + Tailwind
                        code to a GitHub Gist.
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ExportButton
                        text={artifact.generatedCode}
                        variant="copy"
                        label="Copy all"
                        analyticsSource="upload_flow"
                        analyticsFeature="generated_scaffold"
                        onCopied={() => toast("Scaffold copied", "success")}
                      />
                      <ExportButton
                        text={artifact.generatedCode}
                        variant="export"
                        label="Download .tsx"
                        filename={exportFilename}
                        analyticsSource="upload_flow"
                        analyticsFeature="generated_scaffold"
                        onCopied={() => toast("Scaffold exported", "success")}
                      />
                    </div>
                  </CardHeader>
                  {stage === "generated" ? null : (
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">
                        Generate preview to see live stats alongside the snippet.
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
                        title="Generated scaffold"
                        showCopy={false}
                      />
                    </div>
                  </Card>

                  <Card className="min-w-0 bg-background">
                    <CardHeader>
                      <CardTitle className="text-sm">Live preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {artifact.previewStats.map((stat) => (
                          <Card key={stat.label}>
                            <CardContent className="p-4">
                              <div className="text-xs text-muted-foreground">
                                {stat.label}
                              </div>
                              <div className="mt-2 text-2xl font-bold text-card-foreground">
                                {stat.value}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
              Upload a screenshot and run analysis to see the generated plan.
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
