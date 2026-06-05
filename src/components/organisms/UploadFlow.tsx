"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import Image from "next/image";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
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
import {
  buildAnalyzeFailureError,
  isReportableAnalyzeFailure,
} from "@/lib/analyze-observability.mjs";
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
  createShortShareLink,
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
  const router = useRouter();
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
        shortLink ? t.toastShortShareCopied : t.toastShareHashCopied,
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
      setError(t.errorInvalidImage);
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
      setError(t.errorNoImage);
      return null;
    }

    setError(null);
    setProviderState("loading");
    setAnalyzeStep(ANALYZE_STEPS_EN[0]);
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
      setAnalyzeStep(ANALYZE_STEPS_EN[1]);
      const rawDataUrl = await readFileAsDataUrl(file);
      const preprocessed = await preprocessImageDataUrl(rawDataUrl);

      const fileMeta = {
        name: file.name,
        type: file.type,
        size: file.size,
        width: preprocessed.width,
        height: preprocessed.height,
      };

      setAnalyzeStep(ANALYZE_STEPS_EN[2]);
      const outcome = await postAnalyzeUi(fileMeta, preprocessed.dataUrl, {
        onProgress: (step) => setAnalyzeStep(step),
      });

      setArtifact(outcome.artifact as UiFlowArtifact);
      setProviderState(outcome.providerState as ProviderState);
      setProviderMessage(outcome.message);
      setProviderDetail(outcome.detail);
      setStage("analyzed");
      reportAnalyzeFailure(outcome);

      const record: SessionRecord = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        modeLabel: (outcome.artifact as UiFlowArtifact).modeLabel || t.modeLocalDemo,
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
      reportAnalyzeFailure(outcome);
      toast(t.toastAnalyzeFailed, "error");
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
    toastMessage = t.toastPreviewGenerated,
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
    });
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
                  <div className="relative h-96 w-full overflow-hidden rounded-md border border-border">
                    <Image
                      src={previewUrl}
                      alt={
                        file
                          ? interpolate(t.uploadedReferenceAltNamed, {
                              fileName: file.name,
                            })
                          : t.uploadedReferenceAlt
                      }
                      className="object-contain"
                      fill
                      sizes="(max-width: 1024px) 100vw, 880px"
                      loading="lazy"
                      unoptimized
                    />
                  </div>
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
                      <GistExportButton
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

                  <Card className="min-w-0 bg-background">
                    <CardHeader>
                      <CardTitle className="text-sm">{t.livePreview}</CardTitle>
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
