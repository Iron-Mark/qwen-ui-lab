/**
 * Advanced deterministic offline analysis — no AI, no network.
 * Combines known-sample registry, weighted archetype scoring, and form-factor signals.
 */

/** @typedef {{ title: string; body: string }} PlanSection */
/** @typedef {{ label: string; value: string }} PreviewStat */

/** Bundled meetup samples — exact filename match (normalized). */
export const KNOWN_SAMPLES = {
  "dashboard-reference.svg": {
    summary:
      "Admin dashboard shell with stat grid, revenue chart, and activity feed — tuned for live demos.",
    previewStats: [
      { label: "Sections", value: "6" },
      { label: "Components", value: "11" },
      { label: "Breakpoints", value: "3" },
      { label: "Review Items", value: "4" },
    ],
    plan: [
      {
        title: "Visual Input",
        body: "dashboard-reference.svg is the bundled meetup reference (SVG, landscape admin dashboard).",
      },
      {
        title: "Layout Read",
        body: "Detect a dashboard-style shell with a sticky header, four-up stat grid, wide analytics band, and right-rail activity list.",
      },
      {
        title: "Component Map",
        body: "Generate Header, WorkflowBanner, StatCard grid, RevenueCard (Recharts), ChartPreview (Chart.js donut), ActivityList, QuickActionButton row, and Footer.",
      },
      {
        title: "Accessibility Pass",
        body: "Semantic landmarks, 44px primary targets (Fitts), staged decisions (Hick), familiar dashboard patterns (Jakob), and chart values exposed to assistive tech.",
      },
      {
        title: "Human Review",
        body: "Verify spacing against the SVG reference, wire real API data, and swap chart libraries if product standards require it.",
      },
    ],
    generatedCode: `import { StatCard } from "@/components/molecules/StatCard";
import { RevenueCard } from "@/components/molecules/RevenueCard";
import { ChartPreview } from "@/components/organisms/ChartPreview";
import { ActivityList } from "@/components/molecules/ActivityList";

export function GeneratedDashboard() {
  return (
    <section aria-label="Generated dashboard from dashboard-reference.svg">
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <RevenueCard data={revenueData} />
        <ChartPreview />
      </div>
      <ActivityList items={recentActivity} />
    </section>
  );
}`,
  },
};

/** Weighted keyword signals per UI archetype. */
const LAYOUT_ARCHETYPES = {
  dashboard: {
    label: "Dashboard / analytics",
    keywords: [
      { term: "dashboard", weight: 3 },
      { term: "admin", weight: 2 },
      { term: "analytics", weight: 2 },
      { term: "chart", weight: 2 },
      { term: "metrics", weight: 2 },
      { term: "kpi", weight: 2 },
      { term: "reference", weight: 1 },
      { term: "report", weight: 1 },
    ],
    layout:
      "dashboard-style shell with a header, stat grid, analytics region, activity panel, and action controls.",
    components: [
      "Header",
      "WorkflowBanner",
      "StatCard",
      "RevenueCard",
      "ChartPreview",
      "ActivityList",
      "QuickActionButton",
      "Footer",
    ],
    stats: { sections: 5, components: 8, breakpoints: 3, reviewItems: 6 },
    codeVariant: "dashboard",
  },
  auth: {
    label: "Authentication",
    keywords: [
      { term: "login", weight: 3 },
      { term: "signin", weight: 3 },
      { term: "sign-in", weight: 3 },
      { term: "auth", weight: 2 },
      { term: "signup", weight: 2 },
      { term: "register", weight: 2 },
      { term: "password", weight: 1 },
    ],
    layout:
      "centered auth form with brand header, labeled inputs, inline validation, and a primary sign-in CTA.",
    components: [
      "BrandMark",
      "AuthCard",
      "TextField",
      "PasswordField",
      "PrimaryButton",
      "OAuthButtonRow",
      "FooterLinks",
    ],
    stats: { sections: 4, components: 6, breakpoints: 2, reviewItems: 5 },
    codeVariant: "auth",
  },
  mobile: {
    label: "Mobile app shell",
    keywords: [
      { term: "mobile", weight: 3 },
      { term: "phone", weight: 3 },
      { term: "ios", weight: 2 },
      { term: "android", weight: 2 },
      { term: "app", weight: 1 },
    ],
    layout:
      "mobile-first single-column layout with stacked cards, thumb-friendly CTAs, and bottom navigation.",
    components: [
      "MobileHeader",
      "StackedCardList",
      "FloatingActionButton",
      "BottomNav",
      "SheetDrawer",
    ],
    stats: { sections: 4, components: 7, breakpoints: 2, reviewItems: 5 },
    codeVariant: "mobile",
  },
  settings: {
    label: "Settings / profile",
    keywords: [
      { term: "settings", weight: 3 },
      { term: "profile", weight: 3 },
      { term: "preferences", weight: 2 },
      { term: "account", weight: 2 },
      { term: "billing", weight: 1 },
    ],
    layout:
      "settings panel with grouped form sections, toggles, and save/cancel actions.",
    components: [
      "SettingsNav",
      "FormSection",
      "ToggleRow",
      "SelectField",
      "SaveBar",
    ],
    stats: { sections: 4, components: 6, breakpoints: 2, reviewItems: 4 },
    codeVariant: "settings",
  },
  landing: {
    label: "Marketing landing",
    keywords: [
      { term: "landing", weight: 3 },
      { term: "marketing", weight: 2 },
      { term: "hero", weight: 2 },
      { term: "pricing", weight: 2 },
      { term: "homepage", weight: 2 },
      { term: "promo", weight: 1 },
    ],
    layout:
      "marketing landing page with hero, feature grid, social proof, pricing band, and footer CTA.",
    components: [
      "HeroSection",
      "FeatureGrid",
      "TestimonialRow",
      "PricingTable",
      "FooterCTA",
    ],
    stats: { sections: 5, components: 9, breakpoints: 3, reviewItems: 5 },
    codeVariant: "landing",
  },
  ecommerce: {
    label: "E-commerce / catalog",
    keywords: [
      { term: "shop", weight: 2 },
      { term: "store", weight: 2 },
      { term: "cart", weight: 3 },
      { term: "checkout", weight: 3 },
      { term: "product", weight: 2 },
      { term: "catalog", weight: 2 },
    ],
    layout:
      "product catalog with filter sidebar, product grid, quick-view modal, and cart summary.",
    components: [
      "FilterSidebar",
      "ProductGrid",
      "ProductCard",
      "CartDrawer",
      "CheckoutStepper",
    ],
    stats: { sections: 5, components: 10, breakpoints: 3, reviewItems: 6 },
    codeVariant: "ecommerce",
  },
};

const MIME_ARCHETYPE_HINTS = {
  "image/svg+xml": { dashboard: 1 },
  "image/png": {},
  "image/jpeg": {},
  "image/webp": {},
};

/**
 * @param {string} fileName
 */
export function normalizeSampleKey(fileName) {
  const base = String(fileName || "").split(/[/\\]/).pop() || "";
  return base.toLowerCase();
}

/**
 * @param {string} fileName
 * @returns {typeof KNOWN_SAMPLES[string] | null}
 */
export function lookupKnownSample(fileName) {
  return KNOWN_SAMPLES[normalizeSampleKey(fileName)] ?? null;
}

/**
 * @param {number | null | undefined} width
 * @param {number | null | undefined} height
 */
export function inferFormFactor(width, height) {
  if (!width || !height) return { id: "unknown", label: "unknown form factor", boost: {} };
  const ratio = width / height;
  if (width <= 480) {
    return { id: "mobile", label: "mobile viewport", boost: { mobile: 2 } };
  }
  if (width <= 900 || ratio < 0.85) {
    return { id: "tablet", label: "tablet viewport", boost: { mobile: 1 } };
  }
  if (ratio >= 1.55) {
    return { id: "desktop-wide", label: "wide desktop", boost: { dashboard: 1, landing: 1 } };
  }
  return { id: "desktop", label: "desktop", boost: { dashboard: 1 } };
}

/**
 * @param {{ name?: string; type?: string; size?: number; width?: number | null; height?: number | null }} file
 */
export function classifyLayoutArchetype(file) {
  const haystack = normalizeSampleKey(file.name).replace(/\.[a-z0-9]+$/i, "");
  const scores = /** @type {Record<string, number>} */ ({});

  for (const [id, archetype] of Object.entries(LAYOUT_ARCHETYPES)) {
    scores[id] = archetype.keywords.reduce((sum, { term, weight }) => {
      return haystack.includes(term) ? sum + weight : sum;
    }, 0);
  }

  const formFactor = inferFormFactor(file.width, file.height);
  for (const [archetypeId, boost] of Object.entries(formFactor.boost)) {
    scores[archetypeId] = (scores[archetypeId] ?? 0) + boost;
  }

  const mimeHints = MIME_ARCHETYPE_HINTS[file.type || ""] ?? {};
  for (const [archetypeId, boost] of Object.entries(mimeHints)) {
    scores[archetypeId] = (scores[archetypeId] ?? 0) + boost;
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topId, topScore] = ranked[0] ?? ["dashboard", 0];
  const [, secondScore] = ranked[1] ?? ["", 0];

  const archetypeId = topScore > 0 ? topId : "dashboard";
  const confidence =
    topScore === 0
      ? 0.55
      : Math.min(0.98, 0.62 + topScore * 0.08 + (topScore > secondScore ? 0.06 : 0));

  return {
    archetypeId,
    archetype: LAYOUT_ARCHETYPES[archetypeId] ?? LAYOUT_ARCHETYPES.dashboard,
    confidence: Math.round(confidence * 100) / 100,
    formFactor,
    scores,
  };
}

/**
 * @param {string} fileName
 * @param {typeof LAYOUT_ARCHETYPES.dashboard} archetype
 */
function buildGeneratedCode(fileName, archetype) {
  const safeName = fileName.replace(/"/g, '\\"');
  switch (archetype.codeVariant) {
    case "auth":
      return `import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function GeneratedAuthScreen() {
  return (
    <main aria-label="Generated auth from ${safeName}">
      <Card className="mx-auto max-w-md p-6">
        <h1 className="text-xl font-semibold">Sign in</h1>
        {/* Email + password fields */}
        <Button className="mt-4 w-full min-h-11">Continue</Button>
      </Card>
    </main>
  );
}`;
    case "mobile":
      return `export function GeneratedMobileShell() {
  return (
    <div aria-label="Generated mobile shell from ${safeName}" className="flex min-h-dvh flex-col">
      <header className="sticky top-0 border-b p-4">App header</header>
      <main className="flex-1 space-y-3 p-4">{/* stacked cards */}</main>
      <nav aria-label="Primary" className="border-t p-2">{/* bottom nav */}</nav>
    </div>
  );
}`;
    case "settings":
      return `export function GeneratedSettings() {
  return (
    <section aria-label="Generated settings from ${safeName}" className="grid gap-6 lg:grid-cols-[12rem_1fr]">
      <aside>{/* settings nav */}</aside>
      <form className="space-y-4">{/* grouped fields */}</form>
    </section>
  );
}`;
    case "landing":
      return `export function GeneratedLanding() {
  return (
    <>
      <section aria-label="Hero from ${safeName}" className="py-16 text-center">{/* hero */}</section>
      <section aria-label="Features" className="grid gap-6 md:grid-cols-3">{/* features */}</section>
    </>
  );
}`;
    case "ecommerce":
      return `export function GeneratedCatalog() {
  return (
    <div aria-label="Generated catalog from ${safeName}" className="grid gap-6 lg:grid-cols-[14rem_1fr]">
      <aside>{/* filters */}</aside>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{/* product cards */}</div>
    </div>
  );
}`;
    default:
      return `import { StatCard } from "@/components/molecules/StatCard";
import { RevenueCard } from "@/components/molecules/RevenueCard";

export function GeneratedDashboard() {
  return (
    <section aria-label="Generated dashboard from ${safeName}">
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
}

/**
 * Advanced offline overrides when no known sample matches.
 * @param {{ name?: string; type?: string; size?: number; width?: number | null; height?: number | null }} file
 * @param {{ readableSize: string; dimensionLine: string | null }} context
 */
export function buildAdvancedOfflineOverrides(file, context) {
  const fileName = file.name || "uploaded-reference";
  const { archetype, confidence, formFactor } = classifyLayoutArchetype(file);
  const componentList = archetype.components.join(", ");

  /** @type {PlanSection[]} */
  const plan = [
    {
      title: "Visual Input",
      body: [
        `${fileName} is treated as the UI reference (${context.readableSize}, ${file.type || "unknown type"}).`,
        context.dimensionLine,
        formFactor.id !== "unknown"
          ? `Form factor signal: ${formFactor.label}.`
          : null,
      ]
        .filter(Boolean)
        .join(" "),
    },
    {
      title: "Layout Read",
      body: `Classified as ${archetype.label} (confidence ${Math.round(confidence * 100)}%) — ${archetype.layout}`,
    },
    {
      title: "Component Map",
      body: `Generate ${componentList}.`,
    },
    {
      title: "Accessibility Pass",
      body: "Semantic regions, keyboard-focusable controls, readable contrast, alt text for images, and aria labels for chart-like values.",
    },
    {
      title: "Human Review",
      body: "Confirm classification against the screenshot, wire real data, and validate responsive breakpoints.",
    },
  ];

  const stats = archetype.stats;
  /** @type {PreviewStat[]} */
  const previewStats = [
    { label: "Sections", value: String(stats.sections) },
    { label: "Components", value: String(stats.components) },
    { label: "Breakpoints", value: String(stats.breakpoints) },
    { label: "Review Items", value: String(stats.reviewItems) },
  ];

  return {
    plan,
    previewStats,
    generatedCode: buildGeneratedCode(fileName, archetype),
    summary: `${archetype.label} scaffold (${Math.round(confidence * 100)}% confidence, ${formFactor.label}).`,
  };
}
