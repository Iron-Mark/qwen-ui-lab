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

export function buildUiFlowArtifact(file, overrides = {}) {
  const readableSize = formatFileSize(file.size);
  const fileName = file.name || "uploaded-reference";

  const plan = overrides.plan || [
    {
      title: "Visual Input",
      body: `${fileName} is treated as the UI reference image (${readableSize}, ${file.type || "unknown type"}).`,
    },
    {
      title: "Layout Read",
      body: "Detect a dashboard-style shell with a header, stat grid, analytics region, activity panel, and action controls.",
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
  return `import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueCard } from "@/components/dashboard/RevenueCard";

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
