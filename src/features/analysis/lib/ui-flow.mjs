import {
  buildAdvancedOfflineOverrides,
  lookupKnownSample,
  lookupKnownSampleByInspection,
} from "./offline-analyze.mjs";

const workflowSteps = [
  { id: "upload", label: "Upload" },
  { id: "analyze", label: "Analyze" },
  { id: "plan", label: "Plan" },
  { id: "generate", label: "Generate" },
  { id: "preview", label: "Preview" },
  { id: "export", label: "Export" },
];

const defaultPreviewStats = [
  { label: "Sections", value: "5" },
  { label: "Components", value: "8" },
  { label: "Breakpoints", value: "3" },
  { label: "Review Items", value: "6" },
];

const TOKEN_SPACING_VALUES = {
  compact: "0.625rem",
  cozy: "1rem",
  comfortable: "1.5rem",
};

const TOKEN_RADIUS_VALUES = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
};

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function dimensionHint(width, height) {
  if (!width || !height) return null;
  const orientation = width >= height ? "landscape" : "portrait";
  const aspect = (width / height).toFixed(2);
  return `${width}×${height}px ${orientation} frame (aspect ${aspect}).`;
}

/**
 * Resolve offline content: known sample registry → advanced classifier → caller overrides.
 * @param {{
 *   name?: string;
 *   type?: string;
 *   size?: number;
 *   width?: number | null;
 *   height?: number | null;
 *   offlineInspection?: ReturnType<import("./offline-image-inspection.mjs").inspectImageDataPixels> | null;
 *   svgInspection?: ReturnType<import("./offline-svg-inspection.mjs").inspectSvgMarkup> | null;
 * }} file
 * @param {Record<string, unknown>} overrides
 */
function resolveOfflineContent(file, overrides) {
  if (overrides.plan || overrides.previewStats || overrides.generatedCode) {
    return overrides;
  }

  const known = lookupKnownSample(file.name || "");
  if (known) {
    return {
      plan: known.plan,
      previewStats: known.previewStats,
      generatedCode: known.generatedCode,
      summary: known.summary ?? "",
    };
  }

  const visualKnown = lookupKnownSampleByInspection(file.offlineInspection);
  if (visualKnown) {
    return {
      plan: visualKnown.plan,
      previewStats: visualKnown.previewStats,
      generatedCode: visualKnown.generatedCode,
      summary: visualKnown.summary ?? "",
    };
  }

  const readableSize = formatFileSize(file.size);
  const advanced = buildAdvancedOfflineOverrides(file, {
    readableSize,
    dimensionLine: dimensionHint(file.width, file.height),
  });

  return {
    plan: advanced.plan,
    previewStats: advanced.previewStats,
    generatedCode: advanced.generatedCode,
    summary: overrides.summary ?? advanced.summary,
  };
}

export function buildUiFlowArtifact(file, overrides = {}) {
  const readableSize = formatFileSize(file.size);
  const fileName = file.name || "uploaded-reference";
  const offline = resolveOfflineContent(file, overrides);
  const detections = buildDetections(file);

  const plan = overrides.plan || offline.plan;
  const previewStats = normalizePreviewStats(
    overrides.previewStats || offline.previewStats || defaultPreviewStats,
  );
  const generatedCode =
    overrides.generatedCode ||
    offline.generatedCode ||
    createGeneratedCode(fileName);

  return {
    file: {
      name: fileName,
      type: file.type || "unknown",
      size: file.size,
      readableSize,
      width: file.width ?? null,
      height: file.height ?? null,
    },
    steps: workflowSteps,
    plan,
    previewStats,
    generatedCode,
    modeLabel: overrides.modeLabel || "Local demo mode",
    summary: overrides.summary ?? offline.summary ?? "",
    ...(detections ? { detections } : {}),
  };
}

function buildDetections(file) {
  if (!file.offlineInspection?.elements?.length && !file.offlineInspection?.layoutTree) {
    return null;
  }

  return {
    source: {
      width: file.offlineInspection?.sample?.sourceWidth ?? file.width ?? null,
      height: file.offlineInspection?.sample?.sourceHeight ?? file.height ?? null,
    },
    designTokens: file.offlineInspection?.designTokens ?? null,
    elements: file.offlineInspection.elements ?? [],
    layoutTree: file.offlineInspection.layoutTree ?? null,
    quality: file.offlineInspection.quality ?? null,
  };
}

export function regenerateArtifactFromDetections(artifact, detections) {
  if (!artifact || !detections) return artifact;
  const activeElements = (detections.elements ?? []).filter(
    (element) => element.included !== false,
  );
  const existingSectionsStat = artifact.previewStats?.find(
    (stat) => stat.label === "Sections",
  );
  const generatedCode = createGeneratedCodeFromDetections(
    artifact.file?.name ?? "uploaded-reference",
    {
      ...detections,
      elements: activeElements,
    },
  );
  const previewStats = normalizePreviewStats([
    {
      label: existingSectionsStat ? "Sections" : "Active Elements",
      value: existingSectionsStat?.value ?? String(activeElements.length),
    },
    {
      label: "Edited",
      value: String((detections.elements ?? []).filter((element) => element.userEdited).length),
    },
    {
      label: "Primitive Types",
      value: String(new Set(activeElements.map((element) => element.primitive ?? element.kind)).size),
    },
    {
      label: "Confidence",
      value:
        typeof detections.quality?.confidence === "number"
          ? `${Math.round(detections.quality.confidence * 100)}%`
          : "local",
    },
  ]);

  return {
    ...artifact,
    generatedCode,
    previewStats,
    detections: {
      ...detections,
      elements: detections.elements ?? [],
      quality: {
        ...(detections.quality ?? {}),
        elementCount: activeElements.length,
      },
    },
  };
}

function normalizePreviewStats(stats) {
  return stats.map((stat) => ({
    label: stat.label || stat.title || "Item",
    value: stat.value || stat.body || "",
  }));
}

function createGeneratedCode(fileName) {
  return `import { StatCard } from "@/features/home/components/StatCard";
import { RevenueCard } from "@/features/home/components/RevenueCard";

export function GeneratedDashboard() {
  return (
    <section aria-label="Generated dashboard from ${fileName}">
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>
      <RevenueCard data={revenueData} />
    </section>
  );
}`;
}

function createGeneratedCodeFromDetections(fileName, detections) {
  const safeName = String(fileName || "uploaded-reference").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const tokens = normalizeDetectionTokens(detections.designTokens);
  const source = {
    width: Math.max(1, detections.source?.width ?? 1440),
    height: Math.max(1, detections.source?.height ?? 900),
  };
  const elements = (detections.elements ?? []).slice(0, 16).map((element, index) => ({
    id: element.id ?? `element-${index + 1}`,
    kind: element.kind ?? "section",
    primitive: element.primitive ?? element.kind ?? "section",
    confidence: element.confidence ?? 0.5,
    box: element.box,
  }));

  return `const designTokens = ${JSON.stringify(tokens, null, 2)};

const sourceFrame = ${JSON.stringify(source, null, 2)};

const correctedElements = ${JSON.stringify(elements, null, 2)};

export function CorrectedScreenshotScaffold() {
  return (
    <section
      aria-label="Corrected scaffold from ${safeName}"
      className="space-y-4"
      style={{ backgroundColor: designTokens.surface, color: designTokens.foreground }}
    >
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase">Corrected screenshot scaffold</p>
        <h1 className="text-xl font-semibold">${safeName}</h1>
        <p className="text-sm opacity-75">
          {correctedElements.length} reviewed deterministic elements drive this scaffold.
        </p>
      </header>

      <div
        className="relative min-h-[34rem] overflow-hidden border"
        style={{ borderColor: designTokens.border, borderRadius: designTokens.radius }}
      >
        {correctedElements.map((element) => (
          <article
            key={element.id}
            aria-label={element.kind}
            className="absolute overflow-hidden border text-xs shadow-sm"
            style={{
              left: ((element.box.x / sourceFrame.width) * 100) + "%",
              top: ((element.box.y / sourceFrame.height) * 100) + "%",
              width: ((element.box.width / sourceFrame.width) * 100) + "%",
              height: ((element.box.height / sourceFrame.height) * 100) + "%",
              minHeight: "2.25rem",
              backgroundColor: elementTone(element.primitive, designTokens),
              borderColor: designTokens.border,
              borderRadius: designTokens.radius,
              padding: designTokens.space,
            }}
          >
            <p className="font-semibold">{element.primitive}</p>
            <p className="opacity-75">{element.kind} - {Math.round(element.confidence * 100)}%</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function elementTone(primitive, tokens) {
  if (/header|nav|action|button|field/.test(primitive)) return tokens.accent;
  if (/card|media|section/.test(primitive)) return tokens.muted;
  return tokens.surface;
}`;
}

function normalizeDetectionTokens(tokens) {
  return {
    surface: tokens?.surface ?? "#ffffff",
    foreground: tokens?.foreground ?? "#111827",
    accent: tokens?.accent ?? "#2563eb",
    accentForeground: tokens?.accentForeground ?? "#ffffff",
    muted: tokens?.muted ?? "#f3f4f6",
    border: tokens?.border ?? "#d1d5db",
    space: TOKEN_SPACING_VALUES[tokens?.spacing] ?? TOKEN_SPACING_VALUES.cozy,
    radius: TOKEN_RADIUS_VALUES[tokens?.radius] ?? TOKEN_RADIUS_VALUES.md,
  };
}
