"use client";

import { ThemeToggle } from "@/features/shell/components/ThemeToggle";
import { ExportButton } from "@/features/export/components/ExportButton";
import { SnippetPreview } from "@/features/analysis/components/SnippetPreview";
import { UploadDropzone } from "@/features/analysis/components/UploadDropzone";
import { LawInformationCard } from "./LawInformationCard";
import { LawOfUxCard } from "./LawOfUxCard";
import { Header } from "@/features/shell/components/Header";
import { WorkflowBanner } from "@/features/home/components/WorkflowBanner";
import {
  DashboardActivityListCatalogPreview,
  DashboardChannelDonutCatalogPreview,
  DashboardChartCatalogPreview,
  DashboardPerformanceLineCatalogPreview,
  DashboardQuickActionCatalogPreview,
  DashboardRevenueCatalogPreview,
  DashboardStatTrendDownCatalogPreview,
  DashboardStatTrendUpCatalogPreview,
} from "@/features/home/components/DashboardCatalogPreviews";
import { UiLawComplianceChecklist } from "./UiLawComplianceChecklist";
import { LawReferencePanel } from "./LawReferencePanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LAWS_OF_UX } from "@/lib/laws-of-ux";
import { filterCatalogEntries } from "../lib/catalog-filter.mjs";
import type {
  AtomicCatalogEntry,
  AtomicLevel,
  CatalogDomain,
} from "../data/catalog-types";

export type {
  AtomicCatalogEntry,
  AtomicLevel,
  CatalogDomain,
  CatalogPropDoc,
  CatalogVariant,
} from "../data/catalog-types";

const statSnippet = `import { StatCard } from "@/features/home/components/StatCard";

export function ExampleStat() {
  return (
    <StatCard
      stat={{
        label: "Revenue",
        value: "$48,290",
        change: "+12.5%",
        trend: "up",
      }}
    />
  );
}`;

const statDownSnippet = `import { StatCard } from "@/features/home/components/StatCard";

export function ExampleStatDown() {
  return (
    <StatCard
      stat={{
        label: "Churn",
        value: "2.1%",
        change: "-0.4%",
        trend: "down",
      }}
    />
  );
}`;

const productCatalog: AtomicCatalogEntry[] = [
  {
    id: "shadcn-button",
    level: "atom",
    domain: "product",
    name: "Button (shadcn)",
    description: "Primary shadcn/ui control — variants for CTAs, ghost nav, and outline actions.",
    usage: "Import from `@/components/ui/button`; product atoms compose this primitive.",
    sourcePath: "components/ui/button.tsx",
    props: [
      { name: "variant", type: "default | outline | ghost | …", description: "Visual style via CVA." },
      { name: "size", type: "default | sm | lg | icon", description: "Height and padding preset." },
    ],
    variants: [
      { id: "default", label: "Default", preview: <Button>Primary</Button> },
      { id: "outline", label: "Outline", preview: <Button variant="outline">Outline</Button> },
      { id: "ghost", label: "Ghost", preview: <Button variant="ghost">Ghost</Button> },
    ],
    preview: <Button>Primary action</Button>,
    code: `import { Button } from "@/components/ui/button";

export function ExampleButton() {
  return <Button>Primary action</Button>;
}`,
    exportFilename: "button.tsx",
  },
  {
    id: "shadcn-badge",
    level: "atom",
    domain: "product",
    name: "Badge (shadcn)",
    description: "Compact status and tier labels — used in catalog cards and provider mode.",
    usage: "Import from `@/components/ui/badge`; prefer composing in atoms over raw spans.",
    sourcePath: "components/ui/badge.tsx",
    props: [
      { name: "variant", type: "default | secondary | outline | destructive", description: "Badge color preset." },
    ],
    variants: [
      { id: "default", label: "Default", preview: <Badge>Live</Badge> },
      { id: "secondary", label: "Secondary", preview: <Badge variant="secondary">Ready</Badge> },
      { id: "outline", label: "Outline", preview: <Badge variant="outline">Outline</Badge> },
    ],
    preview: <Badge variant="secondary">Ready</Badge>,
    code: `import { Badge } from "@/components/ui/badge";

export function ExampleBadge() {
  return <Badge variant="secondary">Ready</Badge>;
}`,
    exportFilename: "badge.tsx",
  },
  {
    id: "shadcn-input",
    level: "atom",
    domain: "product",
    name: "Input (shadcn)",
    description: "Text and search fields with shared focus ring and border tokens.",
    usage: "Import from `@/components/ui/input`; pair with `Label` for accessible forms.",
    sourcePath: "components/ui/input.tsx",
    props: [
      { name: "type", type: "string", description: "Native input type (text, search, email, …)." },
      { name: "placeholder", type: "string", description: "Placeholder hint text." },
    ],
    preview: <Input type="search" placeholder="Search components…" className="max-w-sm" />,
    code: `import { Input } from "@/components/ui/input";

export function ExampleInput() {
  return <Input type="search" placeholder="Search components…" />;
}`,
    exportFilename: "input.tsx",
  },
  {
    id: "theme-toggle",
    level: "atom",
    domain: "product",
    name: "Theme toggle",
    description: "Light/dark switch with persisted preference and focus ring.",
    usage: "Place in the header nav; toggles document `dark` class and localStorage.",
    sourcePath: "features/shell/components/ThemeToggle.tsx",
    props: [
      { name: "(none)", type: "—", description: "Self-contained; reads ThemeProvider context." },
    ],
    preview: <ThemeToggle />,
    code: `import { ThemeToggle } from "@/features/shell/components/ThemeToggle";

export function ExampleThemeToggle() {
  return <ThemeToggle />;
}`,
    exportFilename: "ThemeToggle.tsx",
  },
  {
    id: "export-button",
    level: "atom",
    domain: "product",
    name: "Export button",
    description: "Copy or download snippet with loading/success/error feedback.",
    usage: "Overlay on preview cards; pass `text`, `variant`, and optional `filename`.",
    sourcePath: "features/export/components/ExportButton.tsx",
    props: [
      { name: "text", type: "string", description: "Source code or content to copy/export." },
      { name: "variant", type: '"copy" | "export"', description: "Clipboard vs file download." },
      { name: "filename", type: "string", description: "Download filename for export variant." },
    ],
    variants: [
      {
        id: "copy",
        label: "Copy",
        preview: <ExportButton text="const x = 1;" variant="copy" label="Copy" />,
      },
      {
        id: "export",
        label: "Export",
        preview: (
          <ExportButton text="const x = 1;" variant="export" filename="snippet.tsx" />
        ),
      },
    ],
    preview: <ExportButton text="const x = 1;" variant="copy" />,
    code: `import { ExportButton } from "@/features/export/components/ExportButton";

export function ExampleExportButton() {
  return (
    <ExportButton
      text="export const hello = 'world';"
      variant="copy"
      label="Copy snippet"
    />
  );
}`,
    exportFilename: "ExportButton.tsx",
  },
  {
    id: "quick-action",
    level: "atom",
    domain: "product",
    name: "Quick action button",
    description: "Icon + label control used in dashboard shortcuts.",
    usage: "Pass an `action` object from dashboard data with label and icon key.",
    sourcePath: "features/home/components/QuickActionButton.tsx",
    props: [
      { name: "action", type: "{ label: string; icon: string }", description: "Shortcut metadata." },
    ],
    preview: <DashboardQuickActionCatalogPreview />,
    code: `import { QuickActionButton } from "@/features/home/components/QuickActionButton";

export function ExampleQuickAction() {
  return (
    <QuickActionButton
      action={{ label: "Invite user", icon: "user-plus" }}
    />
  );
}`,
    exportFilename: "QuickActionButton.tsx",
  },
  {
    id: "snippet-preview",
    level: "molecule",
    domain: "product",
    name: "Snippet preview",
    description: "Monospace code block with Prism highlighting and optional copy.",
    usage: "Wrap generated or catalog snippets; use `hideHeader` when a parent supplies copy/export controls.",
    sourcePath: "features/analysis/components/SnippetPreview.tsx",
    props: [
      { name: "code", type: "string", description: "Source text to highlight." },
      { name: "title", type: "string", description: "Accessible section label." },
      { name: "showCopy", type: "boolean", description: "Show inline copy control." },
    ],
    preview: (
      <SnippetPreview
        code={'export function Hello() {\n  return <p>Hi</p>;\n}'}
        hideHeader
      />
    ),
    code: `import { SnippetPreview } from "@/features/analysis/components/SnippetPreview";

export function ExampleSnippetPreview() {
  return (
    <SnippetPreview
      code={'export function Hello() {\\n  return <p>Hi</p>;\\n}'}
      title="Example"
    />
  );
}`,
    exportFilename: "SnippetPreview.tsx",
  },
  {
    id: "stat-card",
    level: "molecule",
    domain: "product",
    name: "Stat card",
    description: "Metric tile with trend indicator and semantic colors.",
    usage: "Grid in dashboard shell; pass `stat` with label, value, change, and trend.",
    sourcePath: "features/home/components/StatCard.tsx",
    props: [
      { name: "stat", type: "Stat", description: "Metric payload from dashboard-data." },
    ],
    variants: [
      { id: "up", label: "Trend up", preview: <DashboardStatTrendUpCatalogPreview />, code: statSnippet },
      { id: "down", label: "Trend down", preview: <DashboardStatTrendDownCatalogPreview />, code: statDownSnippet },
    ],
    preview: <DashboardStatTrendUpCatalogPreview />,
    code: statSnippet,
    exportFilename: "StatCard.tsx",
  },
  {
    id: "revenue-card",
    level: "molecule",
    domain: "product",
    name: "Revenue card",
    description: "Bar-style revenue summary with period labels.",
    usage: "Pass `revenueData` array; pairs with StatCard grid above charts.",
    sourcePath: "features/home/components/RevenueCard.tsx",
    props: [
      { name: "data", type: "RevenuePoint[]", description: "Monthly revenue series." },
    ],
    preview: <DashboardRevenueCatalogPreview />,
    code: `import { RevenueCard } from "@/features/home/components/RevenueCard";

const revenuePreviewData = [
  { month: "Jan", revenue: 4000 },
  { month: "Feb", revenue: 3000 },
  { month: "Mar", revenue: 5000 },
] satisfies Array<{ month: string; revenue: number }>;

export function ExampleRevenueCard() {
  return <RevenueCard data={revenuePreviewData} />;
}`,
    exportFilename: "RevenueCard.tsx",
  },
  {
    id: "upload-dropzone",
    level: "molecule",
    domain: "product",
    name: "Upload dropzone",
    description: "Dashed drop target for screenshot intake with drag-and-drop.",
    usage: "Wire `onFile` and optional `inputRef`; used by UploadFlow organism.",
    sourcePath: "features/analysis/components/UploadDropzone.tsx",
    props: [
      { name: "onFile", type: "(file: File | null) => void", description: "File selection handler." },
      { name: "previewUrl", type: "string | null", description: "Optional image preview URL." },
    ],
    preview: (
      <UploadDropzone
        onFile={() => {}}
        previewUrl={null}
      />
    ),
    code: `import { UploadDropzone } from "@/features/analysis/components/UploadDropzone";

export function ExampleUploadDropzone() {
  return <UploadDropzone onFile={() => {}} />;
}`,
    exportFilename: "UploadDropzone.tsx",
  },
  {
    id: "performance-line-chart",
    level: "molecule",
    domain: "product",
    name: "Performance line chart",
    description: "Weekly sessions trend via Recharts with theme tokens.",
    usage: "Pass `theme` from useTheme(); colors sync with CSS chart tokens.",
    sourcePath: "features/home/components/PerformanceLineChart.tsx",
    props: [
      { name: "data", type: "PerformanceDataPoint[]", description: "Weekly session series." },
      { name: "theme", type: '"light" | "dark"', description: "Chart palette mode." },
    ],
    preview: <DashboardPerformanceLineCatalogPreview />,
    code: `import { PerformanceLineChart } from "@/features/home/components/PerformanceLineChart";
import { useTheme } from "@/components/providers/ThemeProvider";

const performancePreviewData = [
  { week: "W1", sessions: 2100 },
  { week: "W2", sessions: 2450 },
  { week: "W3", sessions: 2280 },
] satisfies Array<{ week: string; sessions: number }>;

export function ExamplePerformanceLine() {
  const { theme } = useTheme();
  return <PerformanceLineChart data={performancePreviewData} theme={theme} />;
}`,
    exportFilename: "PerformanceLineChart.tsx",
  },
  {
    id: "channel-donut-chart",
    level: "molecule",
    domain: "product",
    name: "Channel donut chart",
    description: "Traffic mix breakdown via Chart.js and react-chartjs-2.",
    usage: "Pass `theme` from useTheme(); legend/tooltip follow card tokens.",
    sourcePath: "features/home/components/ChannelDonutChart.tsx",
    props: [
      { name: "data", type: "ChannelMixPoint[]", description: "Channel share percentages." },
      { name: "theme", type: '"light" | "dark"', description: "Chart palette mode." },
    ],
    preview: <DashboardChannelDonutCatalogPreview />,
    code: `import { ChannelDonutChart } from "@/features/home/components/ChannelDonutChart";
import { useTheme } from "@/components/providers/ThemeProvider";

const channelMixPreviewData = [
  { channel: "Organic", share: 42 },
  { channel: "Paid", share: 28 },
  { channel: "Referral", share: 18 },
] satisfies Array<{ channel: string; share: number }>;

export function ExampleChannelDonut() {
  const { theme } = useTheme();
  return <ChannelDonutChart data={channelMixPreviewData} theme={theme} />;
}`,
    exportFilename: "ChannelDonutChart.tsx",
  },
  {
    id: "header",
    level: "organism",
    domain: "product",
    name: "App header",
    description: "Global nav with logo, routes, live/demo badge, and theme toggle.",
    usage: "Rendered once in root layout; badge reflects /api/health provider state.",
    sourcePath: "features/shell/components/Header.tsx",
    preview: (
      <div className="overflow-hidden rounded-lg border border-border">
        <Header />
      </div>
    ),
    code: `import { Header } from "@/features/shell/components/Header";

export function ExampleHeader() {
  return <Header />;
}`,
    exportFilename: "Header.tsx",
  },
  {
    id: "workflow-banner",
    level: "organism",
    domain: "product",
    name: "Workflow banner",
    description: "Session status strip for the upload-to-export pipeline.",
    usage: "Shown on dashboard below UploadFlow during live demos.",
    sourcePath: "features/home/components/WorkflowBanner.tsx",
    preview: <WorkflowBanner />,
    code: `import { WorkflowBanner } from "@/features/home/components/WorkflowBanner";

export function ExampleWorkflowBanner() {
  return <WorkflowBanner />;
}`,
    exportFilename: "WorkflowBanner.tsx",
  },
  {
    id: "activity-list",
    level: "organism",
    domain: "product",
    name: "Activity list",
    description: "Scrollable feed of recent dashboard events.",
    usage: "Pass `activities` from dashboard-data; slice for compact previews.",
    sourcePath: "features/home/components/ActivityList.tsx",
    props: [
      { name: "activities", type: "Activity[]", description: "Recent events list." },
    ],
    preview: <DashboardActivityListCatalogPreview />,
    code: `import { ActivityList } from "@/features/home/components/ActivityList";

const activityPreviewData = [
  {
    id: "1",
    user: "Olivia Martin",
    action: "Upgraded to Pro plan",
    timestamp: "2 min ago",
  },
] satisfies Array<{
  id: string;
  user: string;
  action: string;
  timestamp: string;
}>;

export function ExampleActivityList() {
  return <ActivityList activities={activityPreviewData} />;
}`,
    exportFilename: "ActivityList.tsx",
  },
  {
    id: "chart-preview",
    level: "organism",
    domain: "product",
    name: "Chart preview card",
    description: "Performance line (Recharts) and channel donut (Chart.js) in one card.",
    usage: "Dashboard organism; auto-themes via ThemeProvider.",
    sourcePath: "features/home/components/ChartPreview.tsx",
    props: [
      { name: "performanceData", type: "PerformanceDataPoint[]", description: "Line chart input." },
      { name: "channelMixData", type: "ChannelMixPoint[]", description: "Donut chart input." },
    ],
    preview: <DashboardChartCatalogPreview />,
    code: `import { ChartPreview } from "@/features/home/components/ChartPreview";

const performancePreviewData = [
  { week: "W1", sessions: 2100 },
  { week: "W2", sessions: 2450 },
  { week: "W3", sessions: 2280 },
] satisfies Array<{ week: string; sessions: number }>;

const channelMixPreviewData = [
  { channel: "Organic", share: 42 },
  { channel: "Paid", share: 28 },
  { channel: "Referral", share: 18 },
] satisfies Array<{ channel: string; share: number }>;

export function ExampleChartPreview() {
  return (
    <ChartPreview
      performanceData={performancePreviewData}
      channelMixData={channelMixPreviewData}
    />
  );
}`,
    exportFilename: "ChartPreview.tsx",
  },
];

const uilawsCatalog: AtomicCatalogEntry[] = [
  {
    id: "law-information-card",
    level: "molecule",
    domain: "uilaws",
    name: "Law information card",
    description: "UILaws-style information card with principle badges.",
    usage: "Surface feature summaries; pass `principles` for law badges.",
    sourcePath: "features/design-system/components/LawInformationCard.tsx",
    principles: ["proximity", "white-space", "typography-hierarchy"],
    props: [
      { name: "title", type: "string", description: "Card heading." },
      { name: "description", type: "string", description: "Supporting copy." },
      { name: "principles", type: "UiLawId[]", description: "Law badges shown under copy." },
    ],
    preview: (
      <LawInformationCard
        title="Design system catalog"
        description="Atomic previews with export, Prism snippets, and variant toggles."
        href="/design-system"
        principles={["proximity", "consistency", "typography-hierarchy"]}
      />
    ),
    code: `import { LawInformationCard } from "@/features/design-system/components/LawInformationCard";

export function ExampleLawInformationCard() {
  return (
    <LawInformationCard
      title="Upload pipeline"
      description="Screenshot to React starter with reviewable detection notes."
      href="/"
      principles={["proximity", "white-space", "typography-hierarchy"]}
    />
  );
}`,
    exportFilename: "LawInformationCard.tsx",
  },
  {
    id: "uilaw-compliance-checklist",
    level: "organism",
    domain: "uilaws",
    name: "UI law compliance checklist",
    description: "Interactive checklist for reviewing generated UI against UX laws.",
    usage: "Manual review below Generate Preview; extend `items` for project rules.",
    sourcePath: "features/design-system/components/UiLawComplianceChecklist.tsx",
    principles: ["fitts", "hick", "jakob", "consistency", "contrast"],
    preview: <UiLawComplianceChecklist />,
    code: `import { UiLawComplianceChecklist } from "@/features/design-system/components/UiLawComplianceChecklist";

export function ExampleComplianceChecklist() {
  return <UiLawComplianceChecklist />;
}`,
    exportFilename: "UiLawComplianceChecklist.tsx",
  },
  {
    id: "law-reference-panel",
    level: "organism",
    domain: "uilaws",
    name: "Law reference panel",
    description: "Maps UILaws principles to qwen-ui-lab routes.",
    usage: "Embed in catalog; set `productOnly` to filter laws with in-app links.",
    sourcePath: "features/design-system/components/LawReferencePanel.tsx",
    principles: ["fitts", "hick", "jakob", "consistency", "contrast", "white-space"],
    preview: <LawReferencePanel productOnly />,
    code: `import { LawReferencePanel } from "@/features/design-system/components/LawReferencePanel";

export function ExampleLawReferencePanel() {
  return <LawReferencePanel productOnly />;
}`,
    exportFilename: "LawReferencePanel.tsx",
  },
];

const lawsOfUxCatalog: AtomicCatalogEntry[] = LAWS_OF_UX.map((law) => ({
  id: `law-of-ux-${law.id}`,
  level: "molecule" as const,
  domain: "laws-of-ux" as const,
  name: law.name,
  description: law.summary,
  usage: law.application,
  sourcePath: "features/design-system/components/LawOfUxCard.tsx",
  lawId: law.id,
  principles: law.relatedUiLawIds,
  preview: <LawOfUxCard law={law} />,
  code: `import { LawOfUxCard } from "@/features/design-system/components/LawOfUxCard";
import { lawOfUxById } from "@/lib/laws-of-ux";

export function Example${law.id.replace(/-/g, "")}() {
  const law = lawOfUxById("${law.id}");
  return law ? <LawOfUxCard law={law} /> : null;
}`,
  exportFilename: `LawOfUx-${law.id}.tsx`,
}));

export const unifiedCatalog: AtomicCatalogEntry[] = [
  ...productCatalog,
  ...uilawsCatalog,
  ...lawsOfUxCatalog,
];

export function filterCatalog(
  query: string,
  level: AtomicLevel | "all",
  domain: CatalogDomain | "all" = "all",
) {
  return filterCatalogEntries(unifiedCatalog, query, level, domain) as AtomicCatalogEntry[];
}
