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
    modeLabel: overrides.modeLabel || "Ready to analyze",
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
  const correctedDetections = recomputeCorrectedDetections(detections);
  const activeElements = (correctedDetections.elements ?? []).filter(
    (element) => element.included !== false,
  );
  const existingSectionsStat = artifact.previewStats?.find(
    (stat) => stat.label === "Sections",
  );
  const generatedCode = createGeneratedCodeFromDetections(
    artifact.file?.name ?? "uploaded-reference",
    {
      ...correctedDetections,
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
      value: String((correctedDetections.elements ?? []).filter((element) => element.userEdited).length),
    },
    {
      label: "Primitive Types",
      value: String(new Set(activeElements.map((element) => element.primitive ?? element.kind)).size),
    },
    {
      label: "Confidence",
      value:
        typeof correctedDetections.quality?.confidence === "number"
          ? `${Math.round(correctedDetections.quality.confidence * 100)}%`
          : "local",
    },
  ]);

  return {
    ...artifact,
    generatedCode,
    previewStats,
    detections: {
      ...correctedDetections,
      elements: correctedDetections.elements ?? [],
    },
  };
}

function recomputeCorrectedDetections(detections) {
  const elements = (detections.elements ?? []).map((element) =>
    recomputeCorrectedElement(element),
  );
  const activeElements = elements.filter((element) => element.included !== false);
  const averageConfidence = activeElements.length
    ? activeElements.reduce((sum, element) => sum + (element.confidence ?? 0.5), 0) /
      activeElements.length
    : 0;
  const editedCount = elements.filter((element) => element.userEdited).length;
  const correctionPenalty = Math.min(0.1, editedCount * 0.015);

  return {
    ...detections,
    elements,
    quality: {
      ...(detections.quality ?? {}),
      confidence: clampConfidence(averageConfidence - correctionPenalty),
      elementCount: activeElements.length,
      correctedElementCount: editedCount,
      strategy: editedCount
        ? `${detections.quality?.strategy ?? "offline-detection"} + manual-correction-source-of-truth`
        : detections.quality?.strategy,
    },
  };
}

function recomputeCorrectedElement(element) {
  const included = element.included !== false;
  const confidence = correctedElementConfidence(element, included);
  return {
    ...element,
    confidence,
    reasons: mergeCorrectionReasons(element, included, confidence),
  };
}

function correctedElementConfidence(element, included) {
  const base = typeof element.confidence === "number" ? element.confidence : 0.5;
  if (!element.userEdited) return clampConfidence(base);
  if (!included) return clampConfidence(Math.min(base, 0.38));
  return clampConfidence(Math.max(0.72, Math.min(0.97, base + 0.08)));
}

function mergeCorrectionReasons(element, included, confidence) {
  const existing = Array.isArray(element.reasons) ? element.reasons : [];
  const withoutCorrection = existing.filter(
    (reason) =>
      !["manual-correction", "manual-exclusion", "correction-confidence"].includes(
        typeof reason === "string" ? reason : reason?.code,
      ),
  );
  if (!element.userEdited) return withoutCorrection;
  const changes = summarizeManualElementChanges(element);

  const correctionReasons = [
    {
      code: "manual-correction",
      label: "Manual correction",
      evidence:
        changes.length
          ? `User-edited ${changes.join(", ")} is the source of truth for regeneration.`
          : "User-edited kind, primitive, role, or geometry is the source of truth for regeneration.",
      weight: 0.96,
    },
    {
      code: "correction-confidence",
      label: "Correction confidence",
      evidence: `Confidence recomputed to ${Math.round(confidence * 100)}% after the manual edit.`,
      weight: 0.82,
    },
  ];

  if (!included) {
    correctionReasons.splice(1, 0, {
      code: "manual-exclusion",
      label: "Excluded from scaffold",
      evidence: "User excluded this detection, so it is omitted from generated sections.",
      weight: 0.98,
    });
  }

  return [...correctionReasons, ...withoutCorrection];
}

function summarizeManualElementChanges(element) {
  const changes = [];
  if (element.kind) changes.push("type");
  if (element.primitive) changes.push("primitive");
  if (element.componentRole) changes.push("role");
  if (element.box) changes.push("geometry");
  if (element.included === false) changes.push("inclusion");
  return [...new Set(changes)].slice(0, 5);
}

function summarizeElementReasons(reasons) {
  if (!Array.isArray(reasons)) return [];
  return reasons
    .map((reason) => {
      if (typeof reason === "string") return reason;
      const label = reason?.label || reason?.code;
      const evidence = reason?.evidence ? `: ${reason.evidence}` : "";
      return label ? `${label}${evidence}` : "";
    })
    .filter(Boolean)
    .slice(0, 5);
}

function clampConfidence(value) {
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(0.99, value));
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
    <section aria-label="Dashboard export based on ${fileName}">
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
    componentRole: element.componentRole ?? element.primitive ?? element.kind ?? "section",
    confidence: element.confidence ?? 0.5,
    userEdited: element.userEdited === true,
    reasons: summarizeElementReasons(element.reasons),
    box: element.box ?? { x: 0, y: 0, width: source.width, height: Math.max(48, source.height / 12) },
  }));
  const patterns = buildCorrectedPatternBlueprint(detections, elements);
  const responsiveIntent = buildCorrectedResponsiveBlueprint(detections);
  const screenIntent = buildCorrectedScreenIntentBlueprint(detections);
  const layoutRegions = buildCorrectedLayoutRegionBlueprint(patterns, elements);

  return `import type { AriaRole } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ElementBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type CorrectedElement = {
  id: string;
  kind: string;
  primitive: string;
  componentRole: string;
  confidence: number;
  userEdited?: boolean;
  reasons?: string[];
  label?: string;
  box: ElementBox;
};

type CorrectedPattern = {
  id: string;
  children: string[];
  confidence?: number;
  rows?: number;
  columns?: number;
  cardCount?: number;
  seriesCount?: number;
  tabCount?: number;
  selectedIndex?: number;
  shellType?: string;
  modalType?: string;
  tabKind?: string;
  navCount?: number;
  regions?: {
    topNavigation?: string | null;
    sideNavigation?: string | null;
    bottomNavigation?: string | null;
  };
  [key: string]: unknown;
};

type CorrectedPatterns = {
  textLines: number;
  appShells: CorrectedPattern[];
  repeatedLists: CorrectedPattern[];
  repeatedGrids: CorrectedPattern[];
  statRows: CorrectedPattern[];
  formGroups: CorrectedPattern[];
  dataTables: CorrectedPattern[];
  charts: CorrectedPattern[];
  actionClusters: CorrectedPattern[];
  tabSets: CorrectedPattern[];
  dialogPanels: CorrectedPattern[];
  emptyStates: CorrectedPattern[];
};

type LayoutRegion = {
  id: string;
  kind: string;
  primitive: string;
  componentRole: string;
  label: string;
  confidence: number;
  role: AriaRole;
  children: string[];
};

type GeneratedSection = {
  id: string;
  kind: string;
  primitive: string;
  title: string;
  description: string;
  layoutClass: string;
  items: CorrectedElement[];
};

const designTokens = ${JSON.stringify(tokens, null, 2)};

const sourceFrame = ${JSON.stringify(source, null, 2)};

const detectedElements: CorrectedElement[] = ${JSON.stringify(elements, null, 2)};

const correctedElements = detectedElements;

const detectedPatterns: CorrectedPatterns = ${JSON.stringify(patterns, null, 2)};

const correctedPatterns = detectedPatterns;

const responsiveIntent = ${JSON.stringify(responsiveIntent, null, 2)};

const screenIntent = ${JSON.stringify(screenIntent, null, 2)};

const layoutRegions: LayoutRegion[] = ${JSON.stringify(layoutRegions, null, 2)};

const groupedElementIds = new Set(
  [
    ...correctedPatterns.appShells,
    ...correctedPatterns.repeatedLists,
    ...correctedPatterns.repeatedGrids,
    ...correctedPatterns.statRows,
    ...correctedPatterns.formGroups,
    ...correctedPatterns.dataTables,
    ...correctedPatterns.charts,
    ...correctedPatterns.actionClusters,
    ...correctedPatterns.tabSets,
    ...correctedPatterns.dialogPanels,
    ...correctedPatterns.emptyStates,
  ].flatMap((pattern) => pattern.children),
);

const correctedElementById = new Map<string, CorrectedElement>(
  correctedElements.map((element) => [element.id, element] as [string, CorrectedElement]),
);

const shadcnPrimitiveMap: Record<string, string> = {
  "app-shell": "App shell with semantic landmarks",
  "top-navigation": "semantic nav + Button ghost controls",
  "side-navigation": "aside navigation + Button ghost controls",
  "bottom-navigation": "mobile nav + Button icon controls",
  "section": "semantic section",
  "text": "typographic content",
  "media": "responsive media surface",
  "field-or-action": "Input or Button",
  "search-field": "Input with visible label",
  "form-field": "Input with helper text",
  "form-group": "Fieldset-style form group",
  "primary-action": "Button",
  "icon-action": "Button size icon",
  "action-cluster": "Button toolbar",
  "card-grid": "responsive Card grid",
  "repeated-grid": "responsive Card grid",
  "repeated-list": "stacked Card rows",
  "metric-card": "Card + Badge trend",
  "stat-row": "metric row with Card tiles",
  "content-card": "Card",
  "chart-panel": "Card with accessible chart summary",
  "chart-series": "Chart card with text fallback",
  "list-item": "Card row",
  "list-row": "Card row",
  "data-table": "semantic table inside Card",
  "tab-set": "Tabs",
  "dialog-panel": "Dialog-ready Card surface",
  "empty-state": "Card with centered recovery action",
};

const generatedSections = buildGeneratedSections(correctedPatterns, correctedElements);

export default function ReviewedScreenshotStarter() {
  return (
    <main
      aria-label="Screenshot export based on ${safeName}"
      className="min-h-dvh bg-background text-foreground"
    >
      <section className="mx-auto grid w-full max-w-6xl gap-6 p-4 sm:p-6 lg:p-8">
        <header className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Reviewed screenshot</Badge>
            <Badge variant="secondary">{screenIntent.label}</Badge>
          </div>
          <div className="grid gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              Generated component
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Built from {correctedElements.length} reviewed detections with shadcn-style primitives,
              responsive sections, and semantic landmarks ready for real data wiring.
            </p>
          </div>
        </header>

        <CorrectionRecipeSummary />

        {generatedSections.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {generatedSections.map((section) => (
              <ScaffoldSection key={section.id} section={section} />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Review needed</CardTitle>
              <CardDescription>
                No strong grouped pattern survived editing. Start from the active primitive list below.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {correctedElements.map((element) => (
                <PrimitivePreview key={element.id} element={element} />
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}

function CorrectionRecipeSummary() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review recipe</CardTitle>
        <CardDescription>
          Manual edits are preserved as canonical detection metadata for deterministic export review.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
        <p>
          <span className="block font-medium text-foreground">Active elements</span>
          {correctedElements.length} reviewed primitives
        </p>
        <p>
          <span className="block font-medium text-foreground">Layout regions</span>
          {layoutRegions.length} export-ready groups
        </p>
        <p>
          <span className="block font-medium text-foreground">Responsive intent</span>
          {responsiveIntent.mode} · {responsiveIntent.breakpoints.join(" / ")}
        </p>
      </CardContent>
    </Card>
  );
}

function ScaffoldSection({ section }: { section: GeneratedSection }) {
  if (section.kind === "tab-set") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{section.title}</CardTitle>
          <CardDescription>{section.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tab-1">
            <TabsList aria-label={section.title}>
              {section.items.slice(0, 4).map((item, index) => (
                <TabsTrigger key={item.id} value={"tab-" + (index + 1)}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {section.items.slice(0, 4).map((item, index) => (
              <TabsContent key={item.id} value={"tab-" + (index + 1)}>
                <PrimitivePreview element={item} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  if (section.kind === "form-group") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{section.title}</CardTitle>
          <CardDescription>{section.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4">
            {section.items.map((item, index) =>
              /action|button/.test(item.componentRole ?? "") ? (
                <Button key={item.id} type="button" className="w-fit">
                  {item.label}
                </Button>
              ) : (
                <label key={item.id} className="grid gap-2 text-sm font-medium">
                  Field {index + 1}
                  <Input placeholder={item.label} />
                </label>
              ),
            )}
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </div>
          <Badge variant="outline">{section.primitive}</Badge>
        </div>
      </CardHeader>
      <CardContent className={section.layoutClass}>
        {section.items.map((item) => (
          <PrimitivePreview key={item.id} element={item} />
        ))}
      </CardContent>
    </Card>
  );
}

function PrimitivePreview({ element }: { element: CorrectedElement }) {
  const role = element.componentRole || element.primitive || element.kind;
  const label = element.label || primitiveLabel(role);
  const confidence = Math.round((element.confidence ?? 0.5) * 100);

  if (/primary-action|icon-action/.test(role)) {
    return (
      <Button type="button" variant={role === "icon-action" ? "outline" : "default"}>
        {label}
      </Button>
    );
  }

  if (/search-field|form-field/.test(role)) {
    return (
      <label className="grid gap-2 text-sm font-medium">
        {label}
        <Input placeholder="Connect real value" />
      </label>
    );
  }

  return (
    <article className="rounded-lg border bg-card p-3 text-card-foreground">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">{label}</p>
        <Badge variant="secondary">{confidence}%</Badge>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        Mapped to {shadcnPrimitiveMap[role] ?? "semantic Card section"}.
      </p>
    </article>
  );
}

function buildGeneratedSections(
  patterns: CorrectedPatterns,
  elements: CorrectedElement[],
): GeneratedSection[] {
  const byId = new Map<string, CorrectedElement>(
    elements.map((element) => [element.id, enrichElement(element)] as [string, CorrectedElement]),
  );
  const groups = [
    ...patterns.appShells.map((pattern) => sectionFromPattern(pattern, byId, "app-shell", "Application shell", "Navigation and page regions grouped as landmarks.", "grid gap-3")),
    ...patterns.dialogPanels.map((pattern) => sectionFromPattern(pattern, byId, "dialog-panel", "Dialog surface", "Modal-ready content with close and action affordances.", "grid gap-3")),
    ...patterns.emptyStates.map((pattern) => sectionFromPattern(pattern, byId, "empty-state", "Empty state", "Sparse fallback content grouped with one recovery action.", "grid place-items-center gap-3 text-center")),
    ...patterns.repeatedLists.map((pattern) => sectionFromPattern(pattern, byId, "repeated-list", "Repeated list", "Rows share rhythm, spacing, and action placement.", "grid gap-2")),
    ...patterns.repeatedGrids.map((pattern) => sectionFromPattern(pattern, byId, "repeated-grid", "Card grid", "Repeated cards snapped into a responsive grid.", "grid gap-3 sm:grid-cols-2")),
    ...patterns.statRows.map((pattern) => sectionFromPattern(pattern, byId, "stat-row", "Metric cards", "KPI cards grouped with consistent hierarchy.", "grid gap-3 sm:grid-cols-2")),
    ...patterns.formGroups.map((pattern) => sectionFromPattern(pattern, byId, "form-group", "Form group", "Inputs and actions arranged as a usable form.", "grid gap-3")),
    ...patterns.dataTables.map((pattern) => sectionFromPattern(pattern, byId, "data-table", "Data table", "Table-like regions preserved for row and column wiring.", "grid gap-2")),
    ...patterns.charts.map((pattern) => sectionFromPattern(pattern, byId, "chart-panel", "Chart panel", "Chart region exported with accessible summary text.", "grid gap-3")),
    ...patterns.actionClusters.map((pattern) => sectionFromPattern(pattern, byId, "action-cluster", "Action cluster", "Controls grouped as a toolbar or segmented control.", "flex flex-wrap gap-2")),
    ...patterns.tabSets.map((pattern) => sectionFromPattern(pattern, byId, "tab-set", "Tabs", "Detected tabs become a real Tabs primitive.", "grid gap-3")),
  ];
  return groups.filter((section) => section.items.length);
}

function sectionFromPattern(
  pattern: CorrectedPattern,
  byId: Map<string, CorrectedElement>,
  primitive: string,
  title: string,
  description: string,
  layoutClass: string,
): GeneratedSection {
  return {
    id: pattern.id,
    kind: primitive,
    primitive,
    title,
    description,
    layoutClass,
    items: (pattern.children ?? [])
      .map((id) => byId.get(id))
      .filter((item): item is CorrectedElement => Boolean(item)),
  };
}

function enrichElement(element: CorrectedElement): CorrectedElement {
  const role = element.componentRole || element.primitive || element.kind;
  return {
    ...element,
    label: primitiveLabel(role),
  };
}

export function CorrectionGridReference() {
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
          {" "}
          {correctedPatterns.appShells.length} app shell patterns, {correctedPatterns.dialogPanels.length} dialog panels, {correctedPatterns.emptyStates.length} empty states, {correctedPatterns.repeatedLists.length} repeated list patterns, {correctedPatterns.repeatedGrids.length} repeated grid patterns, {correctedPatterns.statRows.length} stat rows, {correctedPatterns.formGroups.length} form groups, {correctedPatterns.dataTables.length} data tables, {correctedPatterns.charts.length} chart series, {correctedPatterns.actionClusters.length} action clusters, and {correctedPatterns.tabSets.length} tab sets remain grouped.
        </p>
        <p className="text-xs opacity-70">
          Responsive intent: {responsiveIntent.mode} with {responsiveIntent.breakpoints.join(" / ")} breakpoints.
        </p>
        <p className="text-xs opacity-70">
          Screen intent: {screenIntent.label} at {Math.round(screenIntent.confidence * 100)}% confidence.
        </p>
      </header>

      {correctedPatterns.appShells.length ? (
        <div className="grid gap-3">
          {correctedPatterns.appShells.map((pattern) => (
            <section
              key={pattern.id}
              aria-label="Detected app shell"
              className="space-y-2 border p-3"
              style={{ borderColor: designTokens.border, borderRadius: designTokens.radius }}
            >
              <p className="text-xs font-semibold uppercase">App shell</p>
              <div
                className="grid gap-2 rounded border p-2 text-sm md:grid-cols-[10rem_minmax(0,1fr)]"
                style={{ borderColor: designTokens.border, backgroundColor: designTokens.muted }}
              >
                <aside
                  className="rounded border p-2"
                  style={{ borderColor: designTokens.border, backgroundColor: designTokens.surface }}
                >
                  <p className="font-medium">{primitiveLabel(pattern.shellType)}</p>
                  <p className="text-[11px] opacity-70">{pattern.navCount} navigation landmarks</p>
                </aside>
                <div className="grid gap-2">
                  {pattern.regions?.topNavigation ? (
                    <nav className="rounded border px-3 py-2" style={{ borderColor: designTokens.border }}>
                      Top navigation
                    </nav>
                  ) : null}
                  <main className="grid min-h-24 gap-2 md:grid-cols-[8rem_minmax(0,1fr)]">
                    {pattern.regions?.sideNavigation ? (
                      <nav className="rounded border px-3 py-2" style={{ borderColor: designTokens.border }}>
                        Side navigation
                      </nav>
                    ) : null}
                    <section className="rounded border px-3 py-2" style={{ borderColor: designTokens.border }}>
                      Page content region
                    </section>
                  </main>
                  {pattern.regions?.bottomNavigation ? (
                    <nav className="rounded border px-3 py-2" style={{ borderColor: designTokens.border }}>
                      Bottom navigation
                    </nav>
                  ) : null}
                </div>
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {correctedPatterns.dialogPanels.length ? (
        <div className="grid gap-3">
          {correctedPatterns.dialogPanels.map((pattern) => (
            <section
              key={pattern.id}
              aria-label="Detected dialog panel"
              className="space-y-3 border p-3"
              role="dialog"
              aria-modal="true"
              style={{ borderColor: designTokens.border, borderRadius: designTokens.radius }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase">Dialog panel</p>
                  <p className="text-sm font-medium">{primitiveLabel(pattern.modalType || "centered-dialog")}</p>
                </div>
                <button
                  type="button"
                  aria-label="Close dialog"
                  className="rounded border px-2 py-1 text-[10px]"
                  style={{ borderColor: designTokens.border }}
                >
                  Close
                </button>
              </div>
              <div className="grid gap-2 rounded border p-2" style={{ borderColor: designTokens.border, backgroundColor: designTokens.muted }}>
                {pattern.children.map((childId) => {
                  const child = correctedElementById.get(childId);
                  return child ? (
                    <div key={childId} className="rounded border px-3 py-2 text-sm" style={{ borderColor: designTokens.border, backgroundColor: designTokens.surface }}>
                      {renderCorrectedPrimitive(child, designTokens)}
                    </div>
                  ) : null;
                })}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {correctedPatterns.emptyStates.length ? (
        <div className="grid gap-3">
          {correctedPatterns.emptyStates.map((pattern) => (
            <section
              key={pattern.id}
              aria-label="Detected empty state"
              className="grid min-h-48 place-items-center border p-4 text-center"
              role="status"
              style={{ borderColor: designTokens.border, borderRadius: designTokens.radius }}
            >
              <div className="grid max-w-sm gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase">Empty state</p>
                  <p className="text-sm font-medium">Fallback content with recovery action</p>
                </div>
                <div className="grid gap-2 rounded border p-3" style={{ borderColor: designTokens.border, backgroundColor: designTokens.muted }}>
                  {pattern.children.map((childId) => {
                    const child = correctedElementById.get(childId);
                    return child ? (
                      <div key={childId} className="rounded border px-3 py-2 text-sm" style={{ borderColor: designTokens.border, backgroundColor: designTokens.surface }}>
                        {renderCorrectedPrimitive(child, designTokens)}
                      </div>
                    ) : null;
                  })}
                </div>
                <button
                  type="button"
                  className="mx-auto w-fit rounded px-3 py-2 text-xs font-medium"
                  style={{ backgroundColor: designTokens.accent, color: designTokens.accentForeground }}
                >
                  Recovery action
                </button>
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {correctedPatterns.repeatedLists.length ? (
        <div className="grid gap-3">
          {correctedPatterns.repeatedLists.map((pattern) => (
            <section
              key={pattern.id}
              aria-label="Detected repeated list"
              className="space-y-2 border p-3"
              style={{ borderColor: designTokens.border, borderRadius: designTokens.radius }}
            >
              <p className="text-xs font-semibold uppercase">Repeated list</p>
              <ul className="space-y-2">
                {pattern.children.map((childId, index) => {
                  const child = correctedElementById.get(childId);
                  return (
                    <li
                      key={childId}
                      className="rounded border px-3 py-2 text-sm"
                      style={{ borderColor: designTokens.border, backgroundColor: designTokens.muted }}
                    >
                      <p className="mb-2 text-[11px] font-semibold uppercase opacity-70">
                        Row {index + 1} from {childId}
                      </p>
                      {child ? renderCorrectedPrimitive(child, designTokens) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : null}

      {correctedPatterns.repeatedGrids.length ? (
        <div className="grid gap-3">
          {correctedPatterns.repeatedGrids.map((pattern) => (
            <section
              key={pattern.id}
              aria-label="Detected repeated grid"
              className="space-y-2 border p-3"
              style={{ borderColor: designTokens.border, borderRadius: designTokens.radius }}
            >
              <p className="text-xs font-semibold uppercase">Repeated grid</p>
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: "repeat(" + Math.max(1, pattern.columns ?? 2) + ", minmax(0, 1fr))",
                }}
              >
                {pattern.children.map((childId) => {
                  const child = correctedElementById.get(childId);
                  return (
                    <article
                      key={childId}
                      className="rounded border px-3 py-2 text-sm"
                      style={{ borderColor: designTokens.border, backgroundColor: designTokens.muted }}
                    >
                      {child ? renderCorrectedPrimitive(child, designTokens) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {correctedPatterns.statRows.length ? (
        <div className="grid gap-3">
          {correctedPatterns.statRows.map((pattern) => (
            <section
              key={pattern.id}
              aria-label="Detected stat row"
              className="space-y-2 border p-3"
              style={{ borderColor: designTokens.border, borderRadius: designTokens.radius }}
            >
              <p className="text-xs font-semibold uppercase">Stat row</p>
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: "repeat(" + Math.max(2, pattern.cardCount ?? pattern.children.length) + ", minmax(0, 1fr))",
                }}
              >
                {pattern.children.map((childId, index) => {
                  const child = correctedElementById.get(childId);
                  return (
                    <article
                      key={childId}
                      className="rounded border px-3 py-2 text-sm"
                      style={{ borderColor: designTokens.border, backgroundColor: designTokens.muted }}
                    >
                      <p className="text-[11px] uppercase opacity-70">Metric {index + 1}</p>
                      <p className="font-semibold">{child ? primitiveLabel(child.componentRole || child.primitive || child.kind) : "Metric card"}</p>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {correctedPatterns.formGroups.length ? (
        <div className="grid gap-3">
          {correctedPatterns.formGroups.map((pattern) => (
            <section
              key={pattern.id}
              aria-label="Detected form group"
              className="space-y-2 border p-3"
              style={{ borderColor: designTokens.border, borderRadius: designTokens.radius }}
            >
              <p className="text-xs font-semibold uppercase">Form group</p>
              <form className="grid gap-2">
                {pattern.children.map((childId) => {
                  const child = correctedElementById.get(childId);
                  return child ? (
                    <div
                      key={childId}
                      className="rounded border px-3 py-2 text-sm"
                      style={{ borderColor: designTokens.border, backgroundColor: designTokens.muted }}
                    >
                      {renderCorrectedPrimitive(child, designTokens)}
                    </div>
                  ) : null;
                })}
              </form>
            </section>
          ))}
        </div>
      ) : null}

      {correctedPatterns.dataTables.length ? (
        <div className="grid gap-3">
          {correctedPatterns.dataTables.map((pattern) => (
            <section
              key={pattern.id}
              aria-label="Detected data table"
              className="space-y-2 overflow-x-auto border p-3"
              style={{ borderColor: designTokens.border, borderRadius: designTokens.radius }}
            >
              <p className="text-xs font-semibold uppercase">Data table</p>
              <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
                <tbody>
                  {Array.from({ length: Math.max(1, pattern.rows ?? 3) }).map((_, rowIndex) => (
                    <tr key={rowIndex}>
                      {Array.from({ length: Math.max(1, pattern.columns ?? 3) }).map((_, columnIndex) => {
                        const childId = pattern.children[rowIndex * Math.max(1, pattern.columns ?? 3) + columnIndex];
                        const child = childId ? correctedElementById.get(childId) : null;
                        return (
                          <td
                            key={columnIndex}
                            className="border-b px-3 py-2 align-top"
                            style={{ borderColor: designTokens.border }}
                          >
                            {child ? renderCorrectedPrimitive(child, designTokens) : "Cell"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      ) : null}

      {correctedPatterns.charts.length ? (
        <div className="grid gap-3">
          {correctedPatterns.charts.map((pattern) => (
            <section
              key={pattern.id}
              aria-label="Detected chart series"
              className="space-y-2 border p-3"
              style={{ borderColor: designTokens.border, borderRadius: designTokens.radius }}
            >
              <p className="text-xs font-semibold uppercase">Chart series</p>
              <div className="grid h-28 items-end gap-2 rounded border p-3" style={{
                borderColor: designTokens.border,
                gridTemplateColumns: "repeat(" + Math.max(3, pattern.seriesCount ?? pattern.children.length) + ", minmax(0, 1fr))",
              }}>
                {Array.from({ length: Math.max(3, pattern.seriesCount ?? pattern.children.length) }).map((_, index) => (
                  <span
                    key={index}
                    className="rounded-t"
                    style={{
                      height: [42, 74, 55, 88, 63, 78][index % 6] + "%",
                      backgroundColor: designTokens.accent,
                    }}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {correctedPatterns.actionClusters.length ? (
        <div className="grid gap-3">
          {correctedPatterns.actionClusters.map((pattern) => (
            <section
              key={pattern.id}
              aria-label="Detected action cluster"
              className="space-y-2 border p-3"
              style={{ borderColor: designTokens.border, borderRadius: designTokens.radius }}
            >
              <p className="text-xs font-semibold uppercase">Action cluster</p>
              <div className="flex flex-wrap gap-2">
                {pattern.children.map((childId, index) => {
                  const child = correctedElementById.get(childId);
                  return (
                    <button
                      key={childId}
                      type="button"
                      className="rounded border px-3 py-2 text-xs font-medium"
                      style={{
                        borderColor: designTokens.border,
                        backgroundColor: index === 0 ? designTokens.accent : designTokens.surface,
                        color: index === 0 ? designTokens.accentForeground : designTokens.foreground,
                      }}
                    >
                      {child ? primitiveLabel(child.componentRole || child.primitive || child.kind) : "Action"}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {correctedPatterns.tabSets.length ? (
        <div className="grid gap-3">
          {correctedPatterns.tabSets.map((pattern) => {
            const tabCount = Math.max(2, pattern.tabCount ?? pattern.children.length);
            const selectedIndex = Math.min(tabCount - 1, Math.max(0, pattern.selectedIndex ?? 0));
            return (
              <section
                key={pattern.id}
                aria-label="Detected tab set"
                className="space-y-2 border p-3"
                style={{ borderColor: designTokens.border, borderRadius: designTokens.radius }}
              >
                <p className="text-xs font-semibold uppercase">Tab set</p>
                <div className="grid gap-2">
                  <div
                    role="tablist"
                    className="flex w-fit flex-wrap gap-1 rounded-full border p-1"
                    style={{ borderColor: designTokens.border, backgroundColor: designTokens.muted }}
                  >
                    {Array.from({ length: tabCount }).map((_, index) => {
                      const child = correctedElementById.get(pattern.children[index]);
                      const selected = index === selectedIndex;
                      return (
                        <button
                          key={pattern.children[index] ?? index}
                          type="button"
                          role="tab"
                          aria-selected={selected}
                          className="rounded-full px-3 py-1.5 text-xs font-medium"
                          style={{
                            backgroundColor: selected ? designTokens.accent : designTokens.surface,
                            color: selected ? designTokens.accentForeground : designTokens.foreground,
                          }}
                        >
                          {child ? primitiveLabel(child.componentRole || child.primitive || child.kind) : "Tab " + (index + 1)}
                        </button>
                      );
                    })}
                  </div>
                  <section
                    role="tabpanel"
                    className="rounded border p-3 text-xs"
                    style={{ borderColor: designTokens.border, backgroundColor: designTokens.surface }}
                  >
                    {primitiveLabel(pattern.tabKind || "tabs")} panel {selectedIndex + 1}
                  </section>
                </div>
              </section>
            );
          })}
        </div>
      ) : null}

      <div
        className="relative min-h-[34rem] overflow-hidden border"
        style={{ borderColor: designTokens.border, borderRadius: designTokens.radius }}
      >
        {correctedElements.filter((element) => !groupedElementIds.has(element.id)).map((element) => (
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
            {renderCorrectedPrimitive(element, designTokens)}
          </article>
        ))}
      </div>
    </section>
  );
}

function renderCorrectedPrimitive(element: CorrectedElement, tokens: typeof designTokens) {
  const primitive = element.primitive || element.kind || "section";
  const componentRole = element.componentRole || primitive;
  const label = primitiveLabel(primitive);
  const roleLabel = primitiveLabel(componentRole);
  const confidence = Math.round((element.confidence ?? 0.5) * 100);

  if (/header|nav/.test(primitive)) {
    return (
      <div className="grid gap-2" aria-label={label + " primitive preview"}>
        <p className="font-semibold">{label}</p>
        <div className="flex flex-wrap gap-1">
          {["Main", "Reports", "Settings"].map((item) => (
            <span key={item} className="rounded-full border px-2 py-0.5 text-[10px]" style={{ borderColor: tokens.border }}>
              {item}
            </span>
          ))}
        </div>
        <p className="opacity-70">{element.kind} - {confidence}%</p>
      </div>
    );
  }

  if (/field|action|button|input|control/.test(primitive)) {
    if (componentRole === "search-field") {
      return (
        <div className="grid gap-1.5" aria-label={roleLabel + " primitive preview"}>
          <p className="font-semibold">{roleLabel}</p>
          <div className="flex min-h-8 items-center gap-2 rounded-full border px-2" style={{ borderColor: tokens.border }}>
            <span aria-hidden="true">/</span>
            <span className="opacity-65">Search or filter</span>
          </div>
          <p className="opacity-70">{element.kind} - {confidence}%</p>
        </div>
      );
    }

    if (componentRole === "primary-action" || componentRole === "icon-action") {
      return (
        <div className="grid gap-1.5" aria-label={roleLabel + " primitive preview"}>
          <p className="font-semibold">{roleLabel}</p>
          <button type="button" className="w-fit rounded px-2 py-1 text-[10px]" style={{ backgroundColor: tokens.accent, color: tokens.accentForeground }}>
            Action
          </button>
          <p className="opacity-70">{element.kind} - {confidence}%</p>
        </div>
      );
    }

    return (
      <div className="grid gap-1.5" aria-label={roleLabel + " primitive preview"}>
        <p className="font-semibold">{roleLabel}</p>
        <div className="flex min-h-8 items-center justify-between rounded border px-2" style={{ borderColor: tokens.border }}>
          <span className="opacity-65">Label or value</span>
          <button type="button" className="rounded px-2 py-0.5 text-[10px]" style={{ backgroundColor: tokens.accent, color: tokens.accentForeground }}>
            Action
          </button>
        </div>
        <p className="opacity-70">{element.kind} - {confidence}%</p>
      </div>
    );
  }

  if (/card|panel/.test(primitive)) {
    if (componentRole === "metric-card") {
      return (
        <div className="grid gap-1" aria-label={roleLabel + " primitive preview"}>
          <p className="text-[10px] uppercase opacity-70">Metric</p>
          <p className="text-lg font-semibold">12,340</p>
          <p className="opacity-70">{element.kind} - {confidence}%</p>
        </div>
      );
    }

    return (
      <div className="grid gap-1.5" aria-label={roleLabel + " primitive preview"}>
        <p className="font-semibold">{roleLabel}</p>
        <span className="h-2 w-10/12 rounded-full" style={{ backgroundColor: tokens.border }} />
        <span className="h-2 w-7/12 rounded-full" style={{ backgroundColor: tokens.border }} />
        <p className="opacity-70">{element.kind} - {confidence}%</p>
      </div>
    );
  }

  if (/media|chart/.test(primitive)) {
    return (
      <div className="grid gap-2" aria-label={label + " primitive preview"}>
        <p className="font-semibold">{label}</p>
        <div className="grid h-16 grid-cols-4 items-end gap-1 rounded border p-2" style={{ borderColor: tokens.border }}>
          {[45, 75, 55, 90].map((height, index) => (
            <span key={index} className="rounded-t" style={{ height: height + "%", backgroundColor: tokens.accent }} />
          ))}
        </div>
        <p className="opacity-70">{element.kind} - {confidence}%</p>
      </div>
    );
  }

  if (/text|list/.test(primitive)) {
    return (
      <div className="grid gap-1.5" aria-label={label + " primitive preview"}>
        <p className="font-semibold">{label}</p>
        <span className="h-2 w-11/12 rounded-full" style={{ backgroundColor: tokens.border }} />
        <span className="h-2 w-8/12 rounded-full" style={{ backgroundColor: tokens.border }} />
        <p className="opacity-70">{element.kind} - {confidence}%</p>
      </div>
    );
  }

  return (
    <div aria-label={label + " primitive preview"}>
      <p className="font-semibold">{label}</p>
      <p className="opacity-75">{element.kind} - {confidence}%</p>
    </div>
  );
}

function primitiveLabel(value: string | undefined) {
  return String(value || "section")
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function elementTone(primitive: string | undefined, tokens: typeof designTokens) {
  const value = String(primitive || "");
  if (/header|nav|action|button|field/.test(value)) return tokens.accent;
  if (/card|media|section/.test(value)) return tokens.muted;
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

function buildCorrectedPatternBlueprint(detections, elements) {
  const activeIds = new Set(elements.map((element) => element.id));
  const appShells = detections.layoutTree?.patterns?.appShells ?? [];
  const repeatedLists = detections.layoutTree?.patterns?.repeatedLists ?? [];
  const repeatedGrids = detections.layoutTree?.patterns?.repeatedGrids ?? [];
  const statRows = detections.layoutTree?.patterns?.statRows ?? [];
  const formGroups = detections.layoutTree?.patterns?.formGroups ?? [];
  const dataTables = detections.layoutTree?.patterns?.dataTables ?? [];
  const charts = detections.layoutTree?.patterns?.charts ?? [];
  const actionClusters = detections.layoutTree?.patterns?.actionClusters ?? [];
  const tabSets = detections.layoutTree?.patterns?.tabSets ?? [];
  const dialogPanels = detections.layoutTree?.patterns?.dialogPanels ?? [];
  const emptyStates = detections.layoutTree?.patterns?.emptyStates ?? [];

  return {
    textLines:
      detections.layoutTree?.patterns?.textLines ??
      detections.quality?.patterns?.textLines ??
      0,
    appShells: appShells
      .map((pattern, index) => {
        const children = (pattern.children ?? []).filter((id) => activeIds.has(id));
        if (children.length < 2) return null;
        return {
          id: pattern.id ?? `app-shell-${index + 1}`,
          children,
          shellType: pattern.shellType ?? "navigation-shell",
          confidence: pattern.confidence ?? 0.5,
          navCount: pattern.navCount ?? children.length,
          regions: pattern.regions ?? {},
        };
      })
      .filter(Boolean),
    repeatedLists: repeatedLists
      .map((pattern, index) => {
        const children = (pattern.children ?? []).filter((id) => activeIds.has(id));
        if (children.length < 2) return null;
        return {
          id: pattern.id ?? `repeated-list-${index + 1}`,
          children,
          confidence: pattern.confidence ?? 0.5,
          rhythm: pattern.rhythm ?? null,
        };
      })
      .filter(Boolean),
    repeatedGrids: repeatedGrids
      .map((pattern, index) => {
        const children = (pattern.children ?? []).filter((id) => activeIds.has(id));
        if (children.length < 3) return null;
        return {
          id: pattern.id ?? `repeated-grid-${index + 1}`,
          children,
          confidence: pattern.confidence ?? 0.5,
          rhythm: pattern.rhythm ?? null,
          rows: pattern.rows ?? 1,
          columns: pattern.columns ?? 1,
        };
      })
      .filter(Boolean),
    statRows: statRows
      .map((pattern, index) => {
        const children = (pattern.children ?? []).filter((id) => activeIds.has(id));
        if (children.length < 2) return null;
        return {
          id: pattern.id ?? `stat-row-${index + 1}`,
          children,
          confidence: pattern.confidence ?? 0.5,
          rhythm: pattern.rhythm ?? null,
          cardCount: pattern.cardCount ?? children.length,
        };
      })
      .filter(Boolean),
    formGroups: formGroups
      .map((pattern, index) => {
        const children = (pattern.children ?? []).filter((id) => activeIds.has(id));
        if (children.length < 2) return null;
        return {
          id: pattern.id ?? `form-group-${index + 1}`,
          children,
          confidence: pattern.confidence ?? 0.5,
          rhythm: pattern.rhythm ?? null,
          fieldCount: pattern.fieldCount ?? 0,
          actionCount: pattern.actionCount ?? 0,
        };
      })
      .filter(Boolean),
    dataTables: dataTables
      .map((pattern, index) => {
        const children = (pattern.children ?? []).filter((id) => activeIds.has(id));
        if (children.length < 4) return null;
        return {
          id: pattern.id ?? `data-table-${index + 1}`,
          children,
          confidence: pattern.confidence ?? 0.5,
          rhythm: pattern.rhythm ?? null,
          rows: pattern.rows ?? 1,
          columns: pattern.columns ?? 1,
        };
      })
      .filter(Boolean),
    charts: charts
      .map((pattern, index) => {
        const children = (pattern.children ?? []).filter((id) => activeIds.has(id));
        if (children.length < 3) return null;
        return {
          id: pattern.id ?? `chart-series-${index + 1}`,
          children,
          chartKind: pattern.chartKind ?? "bar",
          confidence: pattern.confidence ?? 0.5,
          rhythm: pattern.rhythm ?? null,
          seriesCount: pattern.seriesCount ?? children.length,
        };
      })
      .filter(Boolean),
    actionClusters: actionClusters
      .map((pattern, index) => {
        const children = (pattern.children ?? []).filter((id) => activeIds.has(id));
        if (children.length < 2) return null;
        return {
          id: pattern.id ?? `action-cluster-${index + 1}`,
          children,
          clusterType: pattern.clusterType ?? "toolbar",
          confidence: pattern.confidence ?? 0.5,
          rhythm: pattern.rhythm ?? null,
          controlCount: pattern.controlCount ?? children.length,
        };
      })
      .filter(Boolean),
    tabSets: tabSets
      .map((pattern, index) => {
        const children = (pattern.children ?? []).filter((id) => activeIds.has(id));
        if (children.length < 2) return null;
        return {
          id: pattern.id ?? `tab-set-${index + 1}`,
          children,
          tabKind: pattern.tabKind ?? "tabs",
          confidence: pattern.confidence ?? 0.5,
          rhythm: pattern.rhythm ?? null,
          tabCount: pattern.tabCount ?? children.length,
          selectedIndex: Math.min(children.length - 1, Math.max(0, pattern.selectedIndex ?? 0)),
        };
      })
      .filter(Boolean),
    dialogPanels: dialogPanels
      .map((pattern, index) => {
        const children = (pattern.children ?? []).filter((id) => activeIds.has(id));
        if (children.length < 1) return null;
        return {
          id: pattern.id ?? `dialog-panel-${index + 1}`,
          children,
          modalType: pattern.modalType ?? "centered-dialog",
          confidence: pattern.confidence ?? 0.5,
          childCount: pattern.childCount ?? Math.max(0, children.length - 1),
          centeredness: pattern.centeredness ?? null,
        };
      })
      .filter(Boolean),
    emptyStates: emptyStates
      .map((pattern, index) => {
        const children = (pattern.children ?? []).filter((id) => activeIds.has(id));
        if (children.length < 1) return null;
        return {
          id: pattern.id ?? `empty-state-${index + 1}`,
          children,
          axis: pattern.axis ?? "centered",
          confidence: pattern.confidence ?? 0.5,
          textCount: pattern.textCount ?? 0,
          actionCount: pattern.actionCount ?? 0,
          supportCount: pattern.supportCount ?? 0,
          centeredness: pattern.centeredness ?? null,
        };
      })
      .filter(Boolean),
  };
}

function buildCorrectedLayoutRegionBlueprint(patterns, elements) {
  const patternGroups = [
    ...patterns.appShells.map((pattern) =>
      correctedRegionFromPattern(pattern, "app-shell", "Application shell", "navigation"),
    ),
    ...patterns.dialogPanels.map((pattern) =>
      correctedRegionFromPattern(pattern, "dialog-panel", "Dialog surface", "dialog"),
    ),
    ...patterns.emptyStates.map((pattern) =>
      correctedRegionFromPattern(pattern, "empty-state", "Empty state", "status"),
    ),
    ...patterns.repeatedLists.map((pattern) =>
      correctedRegionFromPattern(pattern, "repeated-list", "Repeated list", "list"),
    ),
    ...patterns.repeatedGrids.map((pattern) =>
      correctedRegionFromPattern(pattern, "repeated-grid", "Card grid", "region"),
    ),
    ...patterns.statRows.map((pattern) =>
      correctedRegionFromPattern(pattern, "stat-row", "Metric cards", "region"),
    ),
    ...patterns.formGroups.map((pattern) =>
      correctedRegionFromPattern(pattern, "form-group", "Form group", "form"),
    ),
    ...patterns.dataTables.map((pattern) =>
      correctedRegionFromPattern(pattern, "data-table", "Data table", "table"),
    ),
    ...patterns.charts.map((pattern) =>
      correctedRegionFromPattern(pattern, "chart-panel", "Chart panel", "figure"),
    ),
    ...patterns.actionClusters.map((pattern) =>
      correctedRegionFromPattern(pattern, "action-cluster", "Action cluster", "toolbar"),
    ),
    ...patterns.tabSets.map((pattern) =>
      correctedRegionFromPattern(pattern, "tab-set", "Tabs", "tablist"),
    ),
  ];

  if (patternGroups.length) return patternGroups;

  return elements.slice(0, 12).map((element, index) => ({
    id: `corrected-region-${index + 1}`,
    kind: element.kind,
    primitive: element.primitive,
    componentRole: element.componentRole,
    label: toTitleLabel(element.componentRole || element.primitive || element.kind),
    confidence: element.confidence,
    role: roleForCorrectedPrimitive(element.componentRole || element.primitive || element.kind),
    children: [element.id],
  }));
}

function correctedRegionFromPattern(pattern, primitive, label, role) {
  return {
    id: pattern.id,
    kind: primitive,
    primitive,
    componentRole: primitive,
    label,
    confidence: pattern.confidence ?? 0.5,
    role,
    children: pattern.children ?? [],
  };
}

function roleForCorrectedPrimitive(primitive) {
  if (/nav|shell/.test(primitive)) return "navigation";
  if (/form/.test(primitive)) return "form";
  if (/table/.test(primitive)) return "table";
  if (/dialog/.test(primitive)) return "dialog";
  if (/empty/.test(primitive)) return "status";
  return "region";
}

function toTitleLabel(value) {
  return String(value || "section")
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildCorrectedResponsiveBlueprint(detections) {
  const responsive = detections.layoutTree?.responsive ?? detections.quality?.responsive;
  return {
    mode: responsive?.mode ?? "single-column",
    source: responsive?.source ?? "unknown",
    breakpoints: responsive?.breakpoints ?? ["base", "md", "lg"],
    primaryFlow: responsive?.primaryFlow ?? "single readable column with constrained line length",
    columns: responsive?.columns ?? { base: 1, md: 1, lg: 2 },
    tailwindHint: responsive?.tailwindHint ?? "grid gap-4",
    regions: responsive?.regions ?? {},
  };
}

function buildCorrectedScreenIntentBlueprint(detections) {
  const intent = detections.layoutTree?.screenIntent ?? detections.quality?.screenIntent;
  return {
    id: intent?.id ?? "dashboard",
    label: intent?.label ?? "Dashboard or analytics workspace",
    confidence: intent?.confidence ?? 0.55,
    evidence: intent?.evidence ?? [],
    scores: intent?.scores ?? {},
  };
}
