const workflowSteps = [
  { id: "upload", label: "Upload" },
  { id: "analyze", label: "Analyze" },
  { id: "plan", label: "Plan" },
  { id: "generate", label: "Generate" },
  { id: "preview", label: "Preview" },
  { id: "export", label: "Export" },
];

const previewStats = [
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

function inferLayoutFromFileName(fileName) {
  const lower = String(fileName || "").toLowerCase();
  if (lower.includes("mobile") || lower.includes("phone")) {
    return "mobile-first single-column layout with stacked cards and bottom navigation.";
  }
  if (lower.includes("login") || lower.includes("auth") || lower.includes("sign")) {
    return "centered auth form with brand header, input fields, and primary CTA.";
  }
  if (lower.includes("settings") || lower.includes("profile")) {
    return "settings panel with grouped form sections and save actions.";
  }
  if (lower.includes("chart") || lower.includes("analytics") || lower.includes("dashboard")) {
    return "dashboard-style shell with a header, stat grid, analytics region, activity panel, and action controls.";
  }
  return "dashboard-style shell with a header, stat grid, analytics region, activity panel, and action controls.";
}

function dimensionHint(width, height) {
  if (!width || !height) return null;
  const orientation = width >= height ? "landscape" : "portrait";
  const aspect = (width / height).toFixed(2);
  return `${width}×${height}px ${orientation} frame (aspect ${aspect}).`;
}

export function buildUiFlowArtifact(file, overrides = {}) {
  const readableSize = formatFileSize(file.size);
  const fileName = file.name || "uploaded-reference";
  const dims = dimensionHint(file.width, file.height);
  const layoutRead = inferLayoutFromFileName(fileName);

  const plan = overrides.plan || [
    {
      title: "Visual Input",
      body: [
        `${fileName} is treated as the UI reference image (${readableSize}, ${file.type || "unknown type"}).`,
        dims ? `Detected dimensions: ${dims}` : null,
      ]
        .filter(Boolean)
        .join(" "),
    },
    {
      title: "Layout Read",
      body: `Detect a ${layoutRead}`,
    },
    {
      title: "Component Map",
      body: "Generate Header, WorkflowBanner, StatCard, RevenueCard, ChartPreview, ActivityList, QuickActionButton, and Footer.",
    },
    {
      title: "Accessibility Pass",
      body: "Prefer semantic regions, keyboard-focusable controls, readable contrast, alt text for image references, and aria labels for chart-like values.",
    },
    {
      title: "Human Review",
      body: "Flag spacing fidelity, real data wiring, responsive edge cases, and chart-library replacement as manual review items.",
    },
  ];

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
    previewStats: normalizePreviewStats(overrides.previewStats || previewStats),
    generatedCode: overrides.generatedCode || createGeneratedCode(fileName),
    modeLabel: overrides.modeLabel || "Local demo mode",
    summary: overrides.summary || "",
  };
}

function normalizePreviewStats(stats) {
  return stats.map((stat) => ({
    label: stat.label || stat.title || "Item",
    value: stat.value || stat.body || "",
  }));
}

function createGeneratedCode(fileName) {
  return `import { StatCard } from "@/components/molecules/StatCard";
import { RevenueCard } from "@/components/molecules/RevenueCard";

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
