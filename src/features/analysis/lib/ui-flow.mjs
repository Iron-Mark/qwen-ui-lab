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
