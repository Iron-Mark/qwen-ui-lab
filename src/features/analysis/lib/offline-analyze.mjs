import {
  buildImageInspectionPlanSections,
  buildImageInspectionPreviewStats,
} from "./offline-image-inspection.mjs";

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
    generatedCode: `import { StatCard } from "@/features/home/components/StatCard";
import { RevenueCard } from "@/features/home/components/RevenueCard";
import { ChartPreview } from "@/features/home/components/ChartPreview";
import { ActivityList } from "@/features/home/components/ActivityList";

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
  "auth-reference.svg": {
    summary:
      "Centered sign-in screen with brand mark, email/password fields, OAuth row, and recovery links — tuned for live demos.",
    previewStats: [
      { label: "Sections", value: "4" },
      { label: "Components", value: "7" },
      { label: "Breakpoints", value: "2" },
      { label: "Review Items", value: "5" },
    ],
    plan: [
      {
        title: "Visual Input",
        body: "auth-reference.svg is the bundled meetup reference (SVG, centered authentication card on a neutral canvas).",
      },
      {
        title: "Layout Read",
        body: "Detect a centered auth card with brand header, stacked labeled inputs, inline validation slots, primary CTA, OAuth divider, and footer recovery links.",
      },
      {
        title: "Component Map",
        body: "Generate BrandMark, AuthCard, TextField (email), PasswordField, PrimaryButton, OAuthButtonRow (Google/GitHub), and FooterLinks (forgot password, sign up).",
      },
      {
        title: "Accessibility Pass",
        body: "Associate labels with inputs, expose error text via aria-describedby, 44px primary targets (Fitts), logical tab order, and visible focus rings on OAuth buttons.",
      },
      {
        title: "Human Review",
        body: "Verify spacing against the SVG reference, wire real auth provider callbacks, and confirm password visibility toggle behavior.",
      },
    ],
    generatedCode: `import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextField } from "@/features/account/components/TextField";
import { PasswordField } from "@/features/account/components/PasswordField";
import { OAuthButtonRow } from "@/features/account/components/OAuthButtonRow";

export function GeneratedAuthScreen() {
  return (
    <main aria-label="Generated auth from auth-reference.svg" className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-6 p-8">
        <header className="text-center">
          <BrandMark className="mx-auto mb-4" />
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">Welcome back — enter your credentials</p>
        </header>
        <form className="space-y-4">
          <TextField label="Email" type="email" autoComplete="email" />
          <PasswordField label="Password" autoComplete="current-password" />
          <Button className="w-full min-h-11" type="submit">Continue</Button>
        </form>
        <OAuthButtonRow providers={["google", "github"]} />
        <FooterLinks forgotHref="/forgot" signUpHref="/register" />
      </Card>
    </main>
  );
}`,
  },
  "mobile-reference.svg": {
    summary:
      "Mobile app shell with sticky header, stacked feed cards, floating action button, and bottom navigation — tuned for live demos.",
    previewStats: [
      { label: "Sections", value: "4" },
      { label: "Components", value: "8" },
      { label: "Breakpoints", value: "2" },
      { label: "Review Items", value: "5" },
    ],
    plan: [
      {
        title: "Visual Input",
        body: "mobile-reference.svg is the bundled meetup reference (SVG, portrait phone frame ~390×844).",
      },
      {
        title: "Layout Read",
        body: "Detect a mobile-first single-column shell with sticky header, scrollable stacked cards, thumb-zone FAB, and persistent bottom tab bar.",
      },
      {
        title: "Component Map",
        body: "Generate MobileHeader, StackedCardList (avatar + title + meta), FloatingActionButton, BottomNav (Home/Search/Profile), and SheetDrawer for overflow actions.",
      },
      {
        title: "Accessibility Pass",
        body: "Bottom nav uses aria-current for active tab, FAB has an accessible name, cards are keyboard-focusable, and touch targets meet 44px minimum (Fitts).",
      },
      {
        title: "Human Review",
        body: "Verify safe-area insets on iOS, test bottom nav with keyboard open, and wire real navigation routes.",
      },
    ],
    generatedCode: `import { MobileHeader } from "@/features/mobile/components/MobileHeader";
import { StackedCardList } from "@/features/mobile/components/StackedCardList";
import { FloatingActionButton } from "@/features/mobile/components/FloatingActionButton";
import { BottomNav } from "@/features/mobile/components/BottomNav";

export function GeneratedMobileShell() {
  return (
    <div aria-label="Generated mobile shell from mobile-reference.svg" className="relative flex min-h-dvh flex-col bg-background">
      <MobileHeader title="Feed" showSearch />
      <main className="flex-1 space-y-3 overflow-y-auto p-4 pb-24">
        <StackedCardList items={feedItems} />
      </main>
      <FloatingActionButton label="Create post" className="fixed bottom-20 right-4" />
      <BottomNav
        items={[
          { id: "home", label: "Home", href: "/", current: true },
          { id: "search", label: "Search", href: "/search" },
          { id: "profile", label: "Profile", href: "/profile" },
        ]}
      />
    </div>
  );
}`,
  },
  "landing-reference.svg": {
    summary:
      "Marketing landing page with hero band, three-up feature grid, testimonial row, pricing cards, and footer CTA — tuned for live demos.",
    previewStats: [
      { label: "Sections", value: "5" },
      { label: "Components", value: "9" },
      { label: "Breakpoints", value: "3" },
      { label: "Review Items", value: "5" },
    ],
    plan: [
      {
        title: "Visual Input",
        body: "landing-reference.svg is the bundled meetup reference (SVG, wide marketing landing ~1440×900).",
      },
      {
        title: "Layout Read",
        body: "Detect a marketing page with top nav, centered hero (headline + dual CTA), three-column feature grid, social proof strip, pricing band, and footer.",
      },
      {
        title: "Component Map",
        body: "Generate SiteNav, HeroSection, FeatureGrid (icon + title + copy), TestimonialRow, PricingTable (Free/Pro/Enterprise), and FooterCTA with newsletter slot.",
      },
      {
        title: "Accessibility Pass",
        body: "Single h1 in hero, skip link to main content, pricing cards expose plan names to screen readers, and CTA contrast meets WCAG AA.",
      },
      {
        title: "Human Review",
        body: "Verify hero copy hierarchy against the SVG reference, wire analytics on primary CTA, and validate responsive stacking at md/lg breakpoints.",
      },
    ],
    generatedCode: `import { HeroSection } from "@/features/landing/components/HeroSection";
import { FeatureGrid } from "@/features/landing/components/FeatureGrid";
import { TestimonialRow } from "@/features/landing/components/TestimonialRow";
import { PricingTable } from "@/features/landing/components/PricingTable";
import { FooterCTA } from "@/features/landing/components/FooterCTA";

export function GeneratedLanding() {
  return (
    <>
      <SiteNav logo="qwen-ui-lab" links={["Features", "Pricing", "Docs"]} />
      <HeroSection
        aria-label="Hero from landing-reference.svg"
        headline="Ship UI faster with AI-assisted scaffolding"
        primaryCta="Start free"
        secondaryCta="View demo"
      />
      <FeatureGrid features={featureItems} className="py-16" />
      <TestimonialRow quotes={testimonials} />
      <PricingTable plans={pricingPlans} />
      <FooterCTA headline="Ready to build?" ctaLabel="Get started" />
    </>
  );
}`,
  },
  "settings-reference.svg": {
    summary:
      "Account settings panel with side nav, grouped profile fields, notification toggles, and sticky save bar — tuned for live demos.",
    previewStats: [
      { label: "Sections", value: "4" },
      { label: "Components", value: "6" },
      { label: "Breakpoints", value: "2" },
      { label: "Review Items", value: "4" },
    ],
    plan: [
      {
        title: "Visual Input",
        body: "settings-reference.svg is the bundled meetup reference (SVG, desktop settings layout with left rail).",
      },
      {
        title: "Layout Read",
        body: "Detect a two-column settings shell with vertical nav, grouped form sections (Profile, Notifications), toggle rows, and a sticky save/cancel bar.",
      },
      {
        title: "Component Map",
        body: "Generate SettingsNav, FormSection (Profile), TextField group, ToggleRow (email/push alerts), SelectField (timezone), and SaveBar with dirty-state handling.",
      },
      {
        title: "Accessibility Pass",
        body: "Toggle switches expose aria-checked, form sections use fieldset/legend, save bar announces unsaved changes, and focus order follows visual layout.",
      },
      {
        title: "Human Review",
        body: "Verify toggle defaults against the SVG reference, wire optimistic save feedback, and confirm mobile nav collapses to a sheet drawer.",
      },
    ],
    generatedCode: `import { SettingsNav } from "@/features/settings/components/SettingsNav";
import { FormSection } from "@/features/settings/components/FormSection";
import { ToggleRow } from "@/features/settings/components/ToggleRow";
import { SaveBar } from "@/features/settings/components/SaveBar";

export function GeneratedSettings() {
  return (
    <section aria-label="Generated settings from settings-reference.svg" className="grid gap-8 lg:grid-cols-[14rem_1fr]">
      <SettingsNav
        sections={[
          { id: "profile", label: "Profile", current: true },
          { id: "notifications", label: "Notifications" },
          { id: "billing", label: "Billing" },
        ]}
      />
      <form className="space-y-8">
        <FormSection title="Profile">
          <TextField label="Display name" defaultValue="Alex Chen" />
          <TextField label="Email" type="email" defaultValue="alex@example.com" />
        </FormSection>
        <FormSection title="Notifications">
          <ToggleRow label="Email alerts" defaultChecked />
          <ToggleRow label="Push notifications" />
        </FormSection>
        <SaveBar onSave={handleSave} onCancel={handleCancel} />
      </form>
    </section>
  );
}`,
  },
  "ecommerce-reference.svg": {
    summary:
      "E-commerce catalog with filter sidebar, product grid, cart badge, and quick-add CTAs — tuned for live demos.",
    previewStats: [
      { label: "Sections", value: "5" },
      { label: "Components", value: "10" },
      { label: "Breakpoints", value: "3" },
      { label: "Review Items", value: "6" },
    ],
    plan: [
      {
        title: "Visual Input",
        body: "ecommerce-reference.svg is the bundled meetup reference (SVG, desktop catalog with left filter rail).",
      },
      {
        title: "Layout Read",
        body: "Detect a shop shell with top search, filter sidebar (category + price), responsive product grid, and cart affordance in the header.",
      },
      {
        title: "Component Map",
        body: "Generate ShopHeader (search + cart), FilterSidebar, ProductGrid, ProductCard (image, title, price, Add CTA), CartDrawer, and CheckoutStepper.",
      },
      {
        title: "Accessibility Pass",
        body: "Product cards expose name and price to screen readers, filter checkboxes use native inputs, Add buttons have descriptive labels, and cart badge announces item count.",
      },
      {
        title: "Human Review",
        body: "Verify filter state against the SVG reference, wire cart persistence, and validate grid reflow at sm/md/lg breakpoints.",
      },
    ],
    generatedCode: `import { ShopHeader } from "@/features/catalog/components/ShopHeader";
import { FilterSidebar } from "@/features/catalog/components/FilterSidebar";
import { ProductGrid } from "@/features/catalog/components/ProductGrid";
import { ProductCard } from "@/features/catalog/components/ProductCard";
import { CartDrawer } from "@/features/catalog/components/CartDrawer";

export function GeneratedCatalog() {
  return (
    <div aria-label="Generated catalog from ecommerce-reference.svg" className="min-h-dvh bg-background">
      <ShopHeader cartCount={3} onSearch={handleSearch} />
      <div className="grid gap-6 p-6 lg:grid-cols-[14rem_1fr]">
        <FilterSidebar
          categories={["Electronics", "Apparel", "Home"]}
          priceRange={[0, 200]}
        />
        <ProductGrid>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={handleAdd} />
          ))}
        </ProductGrid>
      </div>
      <CartDrawer open={cartOpen} items={cartItems} onCheckout={handleCheckout} />
    </div>
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
  const key = normalizeSampleKey(fileName);
  if (KNOWN_SAMPLES[key]) return KNOWN_SAMPLES[key];
  const stemKey = key.replace(/\.(png|jpe?g|webp)$/i, ".svg");
  return KNOWN_SAMPLES[stemKey] ?? null;
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
 * @param {{
 *   name?: string;
 *   type?: string;
 *   size?: number;
 *   width?: number | null;
 *   height?: number | null;
 *   offlineInspection?: ReturnType<import("./offline-image-inspection.mjs").inspectImageDataPixels> | null;
 * }} file
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

  const inspection = file.offlineInspection;
  if (inspection?.layout) {
    if (inspection.layout.topBand && inspection.layout.leftRail) {
      scores.dashboard = (scores.dashboard ?? 0) + 2;
      scores.settings = (scores.settings ?? 0) + 1;
      scores.ecommerce = (scores.ecommerce ?? 0) + 1;
    }
    if (inspection.layout.bottomBand && formFactor.id === "mobile") {
      scores.mobile = (scores.mobile ?? 0) + 2;
    }
    if (inspection.layout.activeColumns >= 10 && inspection.layout.activeRows >= 5) {
      scores.dashboard = (scores.dashboard ?? 0) + 1;
      scores.landing = (scores.landing ?? 0) + 1;
    }
    if (inspection.layout.estimatedRegions <= 3 && formFactor.id !== "mobile") {
      scores.landing = (scores.landing ?? 0) + 1;
      scores.auth = (scores.auth ?? 0) + 1;
    }
    if (inspection.visualDensity === "high") {
      scores.dashboard = (scores.dashboard ?? 0) + 1;
      scores.ecommerce = (scores.ecommerce ?? 0) + 1;
    }
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
      return `import { StatCard } from "@/features/home/components/StatCard";
import { RevenueCard } from "@/features/home/components/RevenueCard";

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
 * @param {{
 *   name?: string;
 *   type?: string;
 *   size?: number;
 *   width?: number | null;
 *   height?: number | null;
 *   offlineInspection?: ReturnType<import("./offline-image-inspection.mjs").inspectImageDataPixels> | null;
 * }} file
 * @param {{ readableSize: string; dimensionLine: string | null }} context
 */
export function buildAdvancedOfflineOverrides(file, context) {
  const fileName = file.name || "uploaded-reference";
  const { archetype, confidence, formFactor } = classifyLayoutArchetype(file);
  const componentList = archetype.components.join(", ");
  const inspectionSections = buildImageInspectionPlanSections(file.offlineInspection);

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
    ...inspectionSections,
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
  const inspectionStats = buildImageInspectionPreviewStats(file.offlineInspection);
  /** @type {PreviewStat[]} */
  const previewStats =
    inspectionStats ?? [
      { label: "Sections", value: String(stats.sections) },
      { label: "Components", value: String(stats.components) },
      { label: "Breakpoints", value: String(stats.breakpoints) },
      { label: "Review Items", value: String(stats.reviewItems) },
    ];

  return {
    plan,
    previewStats,
    generatedCode: buildGeneratedCode(fileName, archetype),
    summary: `${archetype.label} scaffold (${Math.round(confidence * 100)}% confidence, ${formFactor.label})${
      file.offlineInspection
        ? ` with local pixel signals (${file.offlineInspection.visualDensity} density).`
        : "."
    }`,
  };
}
