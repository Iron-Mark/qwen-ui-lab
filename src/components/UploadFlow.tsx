"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ExportButton } from "@/components/design-system/ExportButton";
import { SnippetPreview } from "@/components/design-system/SnippetPreview";
import { postAnalyzeUi, resolveAnalyzeOutcome } from "@/lib/analyze-outcome.mjs";

interface UiFlowArtifact {
  file: {
    name: string;
    type: string;
    size: number;
    readableSize: string;
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

export function UploadFlow() {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [artifact, setArtifact] = useState<UiFlowArtifact | null>(null);
  const [stage, setStage] = useState<Stage>("empty");
  const [error, setError] = useState<string | null>(null);
  const [providerState, setProviderState] = useState<ProviderState>("idle");
  const [providerMessage, setProviderMessage] = useState<string | null>(null);
  const [providerDetail, setProviderDetail] = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);

  useEffect(() => {
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
    setProviderMessage("Calling /api/analyze-ui...");

    try {
      const imageDataUrl = await readFileAsDataUrl(file);
      const outcome = await postAnalyzeUi(file, imageDataUrl);

      setArtifact(outcome.artifact);
      setProviderState(outcome.providerState as ProviderState);
      setProviderMessage(outcome.message);
      setProviderDetail(outcome.detail);
      setStage("analyzed");
      return outcome.artifact as UiFlowArtifact;
    } catch {
      const outcome = resolveAnalyzeOutcome({
        file,
        fetchError: "Could not read the uploaded image.",
      });
      setArtifact(outcome.artifact);
      setProviderState(outcome.providerState as ProviderState);
      setProviderMessage(outcome.message);
      setProviderDetail(outcome.detail);
      setStage("analyzed");
      return outcome.artifact as UiFlowArtifact;
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
    }
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
    } catch {
      setError(
        "Could not load the sample screenshot. Upload your own image instead.",
      );
    } finally {
      setLoadingSample(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {providerState === "fallback" ? (
        <div
          role="status"
          className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100"
        >
          <p className="font-semibold">Offline demo mode</p>
          <p className="mt-1">
            {providerMessage} The full Upload → Analyze → Preview flow still runs
            locally for your presentation.
          </p>
          {providerDetail ? (
            <p className="mt-1 text-amber-800/80 dark:text-amber-200/80">
              Reason: {providerDetail}
            </p>
          ) : null}
        </div>
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
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            providerState === "qwen"
              ? "border-success/30 bg-success/10 text-success"
              : providerState === "fallback"
                ? "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100"
                : "border-border bg-card text-muted-foreground"
          }`}
        >
          {artifact?.modeLabel ||
            (providerState === "fallback"
              ? "Local demo mode"
              : "Qwen route ready")}
        </div>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="min-w-0 rounded-lg border border-border bg-card p-6">
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              acceptFile(event.dataTransfer.files.item(0));
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="sr-only"
              onChange={(event) => acceptFile(event.target.files?.item(0) ?? null)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex min-h-72 w-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background px-6 text-center transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt={file ? `Uploaded UI reference: ${file.name}` : "Uploaded UI reference"}
                  className="max-h-64 w-full max-w-full rounded-md object-contain"
                  width={800}
                  height={256}
                  unoptimized
                />
              ) : (
                <span className="space-y-2">
                  <span className="block text-lg font-semibold text-card-foreground">
                    Drop a screenshot here
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    PNG, JPG, SVG, or WebP
                  </span>
                </span>
              )}
            </button>
          </div>

          {file ? (
            <div className="mt-4 rounded-lg border border-border bg-background p-4 text-sm">
              <div className="break-words font-medium text-card-foreground">{file.name}</div>
              <div className="mt-1 text-muted-foreground">
                {file.type || "unknown type"} · {artifact?.file.readableSize ?? "ready"}
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadSampleScreenshot()}
              className="rounded-lg border border-dashed border-border bg-background px-4 py-2.5 text-sm font-semibold text-card-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loadingSample || providerState === "loading"}
            >
              {loadingSample ? "Loading sample…" : "Use sample screenshot"}
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={analyzeImage}
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!file || providerState === "loading"}
            >
              {providerState === "loading" ? "Analyzing..." : "Analyze"}
            </button>
            <button
              type="button"
              onClick={generatePreview}
              className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-card-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!file || providerState === "loading"}
            >
              Generate Preview
            </button>
          </div>

          {stage === "analyzed" || stage === "generated" ? (
            <p
              role="status"
              className="mt-4 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success"
            >
              {providerState === "qwen"
                ? "Qwen analysis complete — generate preview to see the scaffold."
                : "Demo analysis complete — generate preview to see the scaffold."}
            </p>
          ) : null}

          {providerMessage && providerState === "qwen" ? (
            <p className="mt-4 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
              {providerMessage}
            </p>
          ) : null}
        </div>

        <div className="min-w-0 rounded-lg border border-border bg-card p-6">
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
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      index <= activeStepIndex
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  {index < 5 ? (
                    <span className="text-muted-foreground">→</span>
                  ) : null}
                </div>
              ),
            )}
          </div>

          {artifact ? (
            <div className="grid gap-5">
              {artifact.summary ? (
                <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
                  {artifact.summary}
                </div>
              ) : null}
              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                {artifact.plan.map((section) => (
                  <div
                    key={section.title}
                    className="min-w-0 rounded-lg border border-border bg-background p-4"
                  >
                    <h3 className="text-sm font-semibold text-card-foreground">
                      {section.title}
                    </h3>
                    <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">
                      {section.body}
                    </p>
                  </div>
                ))}
              </div>

              {stage === "generated" ? (
                <div className="grid min-w-0 gap-5 xl:grid-cols-2">
                  <div className="relative min-w-0 overflow-hidden rounded-lg border border-border">
                    <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
                      <ExportButton
                        text={artifact.generatedCode}
                        variant="copy"
                      />
                      <ExportButton
                        text={artifact.generatedCode}
                        variant="export"
                        filename="generated-dashboard.tsx"
                      />
                    </div>
                    <div className="pt-12">
                      <SnippetPreview
                        code={artifact.generatedCode}
                        title="Generated scaffold"
                        showCopy={false}
                      />
                    </div>
                  </div>

                  <div className="min-w-0 rounded-lg border border-border bg-background p-4">
                    <h3 className="text-sm font-semibold text-card-foreground">
                      Live preview
                    </h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {artifact.previewStats.map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-lg border border-border bg-card p-4"
                        >
                          <div className="text-xs text-muted-foreground">
                            {stat.label}
                          </div>
                          <div className="mt-2 text-2xl font-bold text-card-foreground">
                            {stat.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-72 items-center justify-center rounded-lg border border-border bg-background p-6 text-center text-sm text-muted-foreground">
              Upload a screenshot and run analysis to see the generated plan.
            </div>
          )}
        </div>
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
