"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  ChevronRight,
  Sparkles,
  UploadCloud,
  WandSparkles,
  X,
} from "lucide-react";
import { ExportButton } from "@/components/atoms/ExportButton";
import { SnippetPreview } from "@/components/molecules/SnippetPreview";
import { UploadDropzone } from "@/components/molecules/UploadDropzone";
import { useToast } from "@/components/providers/Toast";
import { postAnalyzeUi } from "@/lib/analyze-outcome.mjs";
import { preprocessImageDataUrl } from "@/lib/image-preprocess.mjs";
import {
  loadSessionHistory,
  saveSession,
  removeSession,
  type SessionRecord,
} from "@/lib/session-history";
import { UiLawsCompliance } from "@/components/organisms/UiLawsCompliance";
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

const SAMPLE_IMAGE_PATH = "/references/dashboard-reference.svg";
const SAMPLE_IMAGE_NAME = "dashboard-reference.svg";

const ANALYZE_STEPS = [
  "Reading image…",
  "Preprocessing image…",
  "Checking provider…",
  "Analyzing layout…",
  "Building artifact…",
];

export function UploadFlow() {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
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
  const [analyzeStep, setAnalyzeStep] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  useEffect(() => {
    setSessions(loadSessionHistory());
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const activeStepIndex = useMemo(() => {
    if (stage === "empty") return -1;
    if (stage === "uploaded") return 0;
    if (stage === "analyzed") return 2;
    return 5;
  }, [stage]);

  const showSplitView = stage === "analyzed" || stage === "generated";

  const analyzeProgress = useMemo(() => {
    if (!analyzeStep) return 0;
    const idx = ANALYZE_STEPS.indexOf(analyzeStep);
    return idx >= 0 ? ((idx + 1) / ANALYZE_STEPS.length) * 100 : 0;
  }, [analyzeStep]);

  const isBusy = providerState === "loading" || loadingSample;
  const canAnalyze = Boolean(file) && providerState !== "loading";
  const canGenerate = Boolean(file) && providerState !== "loading";

  function acceptFile(nextFile: File | null) {
    setError(null);
    setArtifact(null);
    setProviderState("idle");
    setProviderMessage(null);
    setProviderDetail(null);

    if (!nextFile) return;
    if (!nextFile.type.startsWith("image/")) {
      setError("Upload an image file: PNG, JPG, SVG, or WebP.");
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
  }

  async function analyzeImage() {
    if (!file) {
      setError("Choose an image before running analysis.");
      return null;
    }

    setError(null);
    setProviderState("loading");
    setAnalyzeStep(ANALYZE_STEPS[0]);

    try {
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

      if (outcome.instantDemo) {
        toast("Instant offline demo analysis ready", "warning");
      } else if (outcome.providerState === "qwen") {
        toast("Qwen analysis complete", "success");
      } else {
        toast("Fell back to offline demo analysis", "warning");
      }

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
      return outcome.artifact as UiFlowArtifact;
    } finally {
      setAnalyzeStep(null);
    }
  }

  async function generatePreview() {
    if (!file) return;

    let nextArtifact = artifact;
    if (!nextArtifact) {
      nextArtifact = await analyzeImage();
    }
    if (nextArtifact) {
      setStage("generated");
      toast("Preview generated", "success");
    }
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

  async function loadSampleScreenshot() {
    setError(null);
    setLoadingSample(true);
    try {
      const response = await fetch(SAMPLE_IMAGE_PATH);
      if (!response.ok) {
        throw new Error("Sample image unavailable.");
      }
      const blob = await response.blob();
      const sampleFile = new File([blob], SAMPLE_IMAGE_NAME, {
        type: blob.type || "image/svg+xml",
      });
      acceptFile(sampleFile);
      toast("Sample screenshot loaded", "success");
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
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in-50 duration-500">
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

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-muted-foreground">
            Live flow
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            Upload screenshot to component preview
          </h2>
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
                  <Image
                    src={previewUrl}
                    alt={file ? `Uploaded UI reference: ${file.name}` : "Uploaded UI reference"}
                    className="h-auto max-h-96 w-full rounded-md border border-border object-contain"
                    width={800}
                    height={384}
                    sizes="(max-width: 1024px) 100vw, 880px"
                    unoptimized
                  />
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

            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => void loadSampleScreenshot()}
                className="min-h-11 border-dashed"
                disabled={isBusy}
              >
                <UploadCloud className="size-4" aria-hidden />
                {loadingSample ? "Loading sample…" : "Use sample screenshot"}
              </Button>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => void analyzeImage()}
                className="min-h-11 min-w-40 gap-2 shadow-sm"
                disabled={!canAnalyze}
              >
                {providerState === "loading" ? (
                  "Analyzing..."
                ) : (
                  <>
                    <WandSparkles className="size-4" aria-hidden />
                    Analyze
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void generatePreview()}
                className="min-h-11 min-w-40 gap-2"
                disabled={!canGenerate}
              >
                <Sparkles className="size-4" aria-hidden />
                Generate Preview
              </Button>
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

            {stage === "analyzed" || stage === "generated" ? (
              <Alert
                role="status"
                className="mt-4 border-success/30 bg-success/10 text-success"
              >
                <AlertDescription className="font-medium text-success">
                  {providerState === "qwen"
                    ? "Qwen analysis complete — generate preview to see the scaffold."
                    : "Demo analysis complete — generate preview to see the scaffold."}
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
                  <CardContent className="p-4 text-sm text-muted-foreground">
                    {artifact.summary}
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

              {stage === "generated" ? (
                <div className="grid min-w-0 gap-5 xl:grid-cols-2">
                  <Card className="relative min-w-0 overflow-hidden">
                    <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
                      <ExportButton
                        text={artifact.generatedCode}
                        variant="copy"
                        onCopied={() => toast("Scaffold copied", "success")}
                      />
                      <ExportButton
                        text={artifact.generatedCode}
                        variant="export"
                        filename="generated-dashboard.tsx"
                        onCopied={() => toast("Scaffold exported", "success")}
                      />
                    </div>
                    <div className="pt-12">
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
    </section>
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
