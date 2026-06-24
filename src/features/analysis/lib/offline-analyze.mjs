import {
  buildImageInspectionPlanSections,
  buildImageInspectionPreviewStats,
} from "./offline-image-inspection.mjs";
import {
  buildSvgInspectionPlanSections,
  buildSvgInspectionPreviewStats,
} from "./offline-svg-inspection.mjs";

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
  modal: {
    label: "Modal dialog",
    keywords: [
      { term: "modal", weight: 4 },
      { term: "dialog", weight: 4 },
      { term: "overlay", weight: 3 },
      { term: "popup", weight: 2 },
      { term: "sheet", weight: 1 },
      { term: "confirm", weight: 1 },
    ],
    layout:
      "focused overlay with a centered dialog panel, title, compact body copy, close affordance, and primary actions.",
    components: [
      "Dialog",
      "DialogOverlay",
      "DialogContent",
      "DialogHeader",
      "DialogTitle",
      "DialogFooter",
      "Button",
    ],
    stats: { sections: 3, components: 6, breakpoints: 2, reviewItems: 5 },
    codeVariant: "modal",
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

const KNOWN_SAMPLE_SIGNATURES = {
  dashboard: {
    sampleKey: "dashboard-reference.svg",
    averageHash: "3f15577169373fff",
    differenceHash: "014529181c99beb1",
  },
  auth: {
    sampleKey: "auth-reference.svg",
    averageHash: "ffe7efffc3e7ffff",
    differenceHash: "2054546470705c4c",
  },
  mobile: {
    sampleKey: "mobile-reference.svg",
    averageHash: "3f8f0f0ffffffcbd",
    differenceHash: "83c1c1c961010696",
  },
  landing: {
    sampleKey: "landing-reference.svg",
    averageHash: "fec3c3ef2bffe7e7",
    differenceHash: "237060a4a4e8f0f0",
  },
  settings: {
    sampleKey: "settings-reference.svg",
    averageHash: "001f1fdfdedeff7c",
    differenceHash: "80c1414143434103",
  },
  ecommerce: {
    sampleKey: "ecommerce-reference.svg",
    averageHash: "7c5f408181c0edff",
    differenceHash: "474656cacad6cae9",
  },
};

const KNOWN_SIGNATURE_MAX_DISTANCE = 12;
const HEX_BIT_COUNTS = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];

const GENERATED_COMPONENT_NAMES = {
  auth: "GeneratedAuthScreen",
  dashboard: "GeneratedDashboard",
  ecommerce: "GeneratedCatalog",
  landing: "GeneratedLanding",
  modal: "GeneratedDialogOverlay",
  mobile: "GeneratedMobileShell",
  settings: "GeneratedSettings",
};

const GENERATED_REGION_TONES = {
  "bottom-nav": "accent",
  "bottom nav": "accent",
  "action-cluster": "surface",
  "app-shell": "surface",
  "button-or-input": "surface",
  "card-or-panel": "muted",
  "chart-or-media": "muted",
  "chart-series": "muted",
  "content panel": "muted",
  "content-block": "surface",
  "data-table": "surface",
  "dialog-panel": "surface",
  "form-group": "surface",
  "control cluster": "surface",
  control: "surface",
  header: "accent",
  "header/nav": "accent",
  "input-or-button-row": "surface",
  "media/chart": "muted",
  "repeated-grid": "surface",
  "repeated-list": "surface",
  "stat-row": "surface",
  "tab-set": "surface",
  "side-nav": "accent",
  "side rail": "accent",
  "text-row": "surface",
  "text/list": "surface",
};

const GENERATED_REGION_GUIDANCE = {
  "bottom-nav": "Persistent mobile navigation or action shortcuts.",
  "bottom nav": "Persistent mobile navigation or action shortcuts.",
  "action-cluster": "Grouped toolbar, segmented control, or CTA row inferred from aligned controls.",
  "app-shell": "Grouped top, side, or bottom navigation landmarks; preserve the shell before rendering page content.",
  "button-or-input": "Likely form control or primary action; preserve label, focus state, and target size.",
  "card-or-panel": "Grouped content card or panel with heading and body structure.",
  "chart-or-media": "Visual content area, metric chart, or media preview.",
  "chart-series": "Grouped chart marks; preserve baseline rhythm, axis spacing, and readable summary labels.",
  "content panel": "Primary content container with clear heading hierarchy.",
  "content-block": "General content block inferred from local connected components.",
  "data-table": "Structured rows and columns; preserve headers, alignment, and horizontal scroll on small screens.",
  "dialog-panel": "Centered modal surface detected from a floating panel; preserve scrim, focus trap, title, and close affordance.",
  "form-group": "Grouped form flow with fields and submit/action controls.",
  "control cluster": "Grouped actions with explicit labels and large targets.",
  control: "Small control, icon button, checkbox, or compact action.",
  header: "Top-level navigation, page title, or primary toolbar.",
  "header/nav": "Top-level navigation, page title, or primary toolbar.",
  "input-or-button-row": "Wide form row, search field, or CTA strip inferred by aspect ratio.",
  "media/chart": "Visual content area, metric chart, or media preview.",
  "repeated-grid": "Repeated card grid detected from aligned rows, columns, and matching item sizes.",
  "repeated-list": "Repeated list or feed detected from aligned rows and vertical rhythm.",
  "stat-row": "KPI row detected from aligned metric cards; preserve labels, values, and trend context.",
  "tab-set": "Adjacent tab or segmented-control triggers; preserve selected state and panel switching affordance.",
  "side-nav": "Secondary navigation, filters, or section index.",
  "side rail": "Secondary navigation, filters, or section index.",
  "text-row": "Text-like row or list item; preserve reading order.",
  "text/list": "Readable list, feed, or supporting copy region.",
};

const GENERATED_REGION_ROLES = {
  "bottom-nav": "navigation",
  "bottom nav": "navigation",
  "action-cluster": "toolbar",
  "app-shell": "group",
  "button-or-input": "group",
  "data-table": "table",
  "dialog-panel": "group",
  "chart-series": "group",
  "form-group": "form",
  "control cluster": "group",
  control: "group",
  header: "banner",
  "header/nav": "banner",
  "input-or-button-row": "group",
  "repeated-grid": "list",
  "repeated-list": "list",
  "stat-row": "list",
  "tab-set": "tablist",
  "side-nav": "navigation",
  "side rail": "navigation",
};

const TOKEN_SPACING_VALUES = {
  compact: "0.75rem",
  cozy: "1rem",
  comfortable: "1.25rem",
};

const TOKEN_RADIUS_VALUES = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
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
 * @param {ReturnType<import("./offline-image-inspection.mjs").inspectImageDataPixels> | null | undefined} inspection
 * @returns {typeof KNOWN_SAMPLES[string] | null}
 */
export function lookupKnownSampleByInspection(inspection) {
  const signature = inspection?.imageSignature;
  if (!signature?.averageHash || !signature?.differenceHash) return null;
  if (signature.method && signature.method !== "luma-a8-d8") return null;

  let bestMatch = null;
  for (const known of Object.values(KNOWN_SAMPLE_SIGNATURES)) {
    const averageDistance = hammingDistance(signature.averageHash, known.averageHash);
    const differenceDistance = hammingDistance(
      signature.differenceHash,
      known.differenceHash,
    );
    const distance = averageDistance + differenceDistance;

    if (!bestMatch || distance < bestMatch.distance) {
      bestMatch = { sampleKey: known.sampleKey, distance };
    }
  }

  if (!bestMatch || bestMatch.distance > KNOWN_SIGNATURE_MAX_DISTANCE) {
    return null;
  }

  return KNOWN_SAMPLES[bestMatch.sampleKey] ?? null;
}

function hammingDistance(first, second) {
  const left = String(first || "");
  const right = String(second || "");
  const length = Math.min(left.length, right.length);
  let distance = Math.abs(left.length - right.length) * 4;

  for (let index = 0; index < length; index += 1) {
    const leftNibble = Number.parseInt(left[index], 16);
    const rightNibble = Number.parseInt(right[index], 16);
    if (!Number.isFinite(leftNibble) || !Number.isFinite(rightNibble)) {
      distance += 4;
    } else {
      distance += HEX_BIT_COUNTS[leftNibble ^ rightNibble];
    }
  }

  return distance;
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
 *   svgInspection?: ReturnType<import("./offline-svg-inspection.mjs").inspectSvgMarkup> | null;
 * }} file
 */
export function classifyLayoutArchetype(file) {
  const svgInspection = resolveSvgInspection(file);
  const haystack = [
    normalizeSampleKey(file.name).replace(/\.[a-z0-9]+$/i, ""),
    ...(svgInspection?.labels ?? []),
  ]
    .join(" ")
    .toLowerCase();
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

  for (const hint of svgInspection?.archetypeHints ?? []) {
    scores[hint.id] = (scores[hint.id] ?? 0) + Math.min(3, hint.score);
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
  const screenIntent = inspection?.layoutTree?.screenIntent ?? inspection?.quality?.screenIntent;
  if (screenIntent?.id && Object.hasOwn(LAYOUT_ARCHETYPES, screenIntent.id)) {
    const intentBoost = Math.min(4.5, 1.5 + (screenIntent.confidence ?? 0.55) * 3);
    scores[screenIntent.id] = (scores[screenIntent.id] ?? 0) + intentBoost;
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
 * @param {ReturnType<import("./offline-image-inspection.mjs").inspectImageDataPixels> | null | undefined} inspection
 * @param {ReturnType<import("./offline-svg-inspection.mjs").inspectSvgMarkup> | null | undefined} svgInspection
 */
function buildGeneratedCode(fileName, archetype, inspection, svgInspection) {
  const safeName = escapeGeneratedString(fileName);
  if (inspection) {
    return buildSignalAwareGeneratedCode(safeName, archetype, inspection);
  }
  if (svgInspection) {
    return buildSvgAwareGeneratedCode(safeName, archetype, svgInspection);
  }

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
    case "modal":
      return `export function GeneratedDialogOverlay() {
  return (
    <div aria-label="Generated modal dialog from ${safeName}" className="fixed inset-0 grid place-items-center p-4">
      <section role="dialog" aria-modal="true" className="w-full max-w-lg rounded-2xl border p-6 shadow-xl">
        <button type="button" aria-label="Close dialog">Close</button>
        <h1 className="mt-3 text-xl font-semibold">Dialog title</h1>
        <p className="mt-2 text-sm opacity-75">Detected modal body content.</p>
        <div className="mt-5 flex justify-end gap-2">{/* dialog actions */}</div>
      </section>
    </div>
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

function buildSvgAwareGeneratedCode(safeName, archetype, svgInspection) {
  const componentName =
    GENERATED_COMPONENT_NAMES[archetype.codeVariant] ?? GENERATED_COMPONENT_NAMES.dashboard;
  const labels = buildGeneratedSvgLabelBlueprint(svgInspection, archetype);
  const stats = buildGeneratedSvgStats(svgInspection);
  const layoutClass =
    svgInspection.source.width && svgInspection.source.height && svgInspection.source.width < svgInspection.source.height
      ? "mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-4"
      : "grid gap-4 p-6 lg:grid-cols-[16rem_1fr]";

  return `const svgLabels = ${JSON.stringify(labels, null, 2)};

const svgStructure = ${JSON.stringify(stats, null, 2)};

export function ${componentName}() {
  return (
    <section aria-label="Generated ${archetype.label.toLowerCase()} from ${safeName}" className="space-y-4">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase">Local SVG scaffold</p>
        <h1 className="text-xl font-semibold">{svgLabels[0]?.label ?? "${archetype.label}"}</h1>
        <p className="text-sm text-muted-foreground">
          {svgStructure.shapeCount} vector shapes, {svgStructure.groupCount} groups, and{" "}
          {svgStructure.textCount} labels were parsed locally.
        </p>
      </header>

      <div className="${layoutClass}">
        <nav aria-label="SVG labels" className="space-y-2 rounded-md border p-3">
          {svgLabels.slice(0, 6).map((item) => (
            <a key={item.id} className="block text-sm font-medium" href={"#" + item.id}>
              {item.label}
            </a>
          ))}
        </nav>
        <main className="grid gap-3">
          {svgLabels.map((item) => (
            <section key={item.id} id={item.id} className="rounded-md border p-4">
              <p className="text-xs font-medium uppercase">{item.intent}</p>
              <h2 className="mt-2 font-semibold">{item.label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.guidance}</p>
            </section>
          ))}
        </main>
      </div>
    </section>
  );
}`;
}

function buildGeneratedSvgLabelBlueprint(svgInspection, archetype) {
  const labels = svgInspection.labels.length
    ? svgInspection.labels
    : [archetype.label, ...archetype.components.slice(0, 4)];

  return labels.slice(0, 10).map((label, index) => ({
    id: `svg-section-${index + 1}`,
    label,
    intent: classifySvgLabelIntent(label),
    guidance: svgGuidanceForLabel(label, archetype),
  }));
}

function buildGeneratedSvgStats(svgInspection) {
  return {
    viewBox: svgInspection.source.viewBox?.length
      ? svgInspection.source.viewBox.join(" ")
      : "not provided",
    width: svgInspection.source.width,
    height: svgInspection.source.height,
    shapeCount: svgInspection.shapeCount,
    groupCount: svgInspection.groupCount,
    textCount: svgInspection.labels.length,
    complexity: svgInspection.complexity,
  };
}

function classifySvgLabelIntent(label) {
  const value = String(label || "").toLowerCase();
  if (/email|password|name|search|filter|price|billing/.test(value)) return "field";
  if (/continue|save|submit|checkout|start|get started|sign in|login/.test(value)) return "action";
  if (/dashboard|settings|profile|analytics|features|pricing|catalog/.test(value)) return "section";
  return "content";
}

function svgGuidanceForLabel(label, archetype) {
  const intent = classifySvgLabelIntent(label);
  if (intent === "field") {
    return "Render as a labeled form control with helper text and aria-describedby for validation.";
  }
  if (intent === "action") {
    return "Render as a primary or secondary action with a descriptive accessible name.";
  }
  if (intent === "section") {
    return "Render as a semantic region heading and preserve the source SVG hierarchy.";
  }
  return `Use this SVG label as copy or metadata inside the ${archetype.label.toLowerCase()} scaffold.`;
}

function buildSignalAwareGeneratedCode(safeName, archetype, inspection) {
  const componentName =
    GENERATED_COMPONENT_NAMES[archetype.codeVariant] ?? GENERATED_COMPONENT_NAMES.dashboard;
  const tokens = buildGeneratedTokenBlueprint(inspection.designTokens);
  const regions = buildGeneratedRegionBlueprint(inspection, archetype);
  const detectedElements = buildGeneratedElementBlueprint(inspection);
  const detectedPatterns = buildGeneratedPatternBlueprint(inspection);
  const responsiveIntent = buildGeneratedResponsiveBlueprint(inspection);
  const screenIntent = buildGeneratedScreenIntentBlueprint(inspection);
  const gridRows = Math.max(1, inspection.layout.gridRows);
  const gridColumns = Math.max(1, inspection.layout.gridColumns);

  return `const designTokens = ${JSON.stringify(tokens, null, 2)};

const detectedElements = ${JSON.stringify(detectedElements, null, 2)};

const detectedPatterns = ${JSON.stringify(detectedPatterns, null, 2)};

const responsiveIntent = ${JSON.stringify(responsiveIntent, null, 2)};

const screenIntent = ${JSON.stringify(screenIntent, null, 2)};

const layoutRegions = ${JSON.stringify(regions, null, 2)};

export function ${componentName}() {
  return (
    <section
      aria-label="Generated ${archetype.label.toLowerCase()} from ${safeName}"
      className="space-y-4"
      style={{ backgroundColor: designTokens.surface, color: designTokens.foreground }}
    >
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase">Local screenshot scaffold</p>
        <h1 className="text-xl font-semibold">${archetype.label}</h1>
        <p className="text-sm opacity-75">
          {detectedElements.length} deterministic UI elements were detected before scaffold generation.
          {" "}
          {detectedPatterns.appShells.length} app shell patterns, {detectedPatterns.dialogPanels.length} dialog panels, {detectedPatterns.repeatedLists.length} repeated list patterns, {detectedPatterns.repeatedGrids.length} repeated grid patterns, {detectedPatterns.statRows.length} stat rows, {detectedPatterns.formGroups.length} form groups, {detectedPatterns.dataTables.length} data tables, {detectedPatterns.charts.length} chart series, {detectedPatterns.actionClusters.length} action clusters, {detectedPatterns.tabSets.length} tab sets, and {detectedPatterns.textLines} text-line signals shape the scaffold.
        </p>
        <p className="text-xs opacity-70">
          Responsive intent: {responsiveIntent.mode} using {responsiveIntent.breakpoints.join(" / ")} breakpoints.
        </p>
        <p className="text-xs opacity-70">
          Screen intent: {screenIntent.label} at {Math.round(screenIntent.confidence * 100)}% confidence.
        </p>
      </header>

      {detectedPatterns.appShells.length ? (
        <section
          aria-label="Detected app shell"
          className="grid gap-3 border p-3"
          style={{ borderColor: designTokens.border, borderRadius: designTokens.radius }}
        >
          <p className="text-xs font-semibold uppercase">App shell</p>
          {detectedPatterns.appShells.map((shell) => (
            <div
              key={shell.id}
              className="grid gap-2 rounded border p-2 text-xs md:grid-cols-[10rem_minmax(0,1fr)]"
              style={{ borderColor: designTokens.border, backgroundColor: designTokens.muted }}
            >
              <aside
                className="rounded border p-2"
                style={{ borderColor: designTokens.border, backgroundColor: designTokens.surface }}
              >
                <p className="font-medium">{formatPrimitiveLabel(shell.shellType)}</p>
                <p className="mt-1 opacity-70">{shell.navCount} navigation landmarks</p>
              </aside>
              <div className="grid gap-2">
                {shell.regions.topNavigation ? (
                  <nav className="rounded border px-3 py-2" style={{ borderColor: designTokens.border }}>
                    Top navigation
                  </nav>
                ) : null}
                <main className="grid min-h-24 gap-2 md:grid-cols-[8rem_minmax(0,1fr)]">
                  {shell.regions.sideNavigation ? (
                    <nav className="rounded border px-3 py-2" style={{ borderColor: designTokens.border }}>
                      Side navigation
                    </nav>
                  ) : null}
                  <section className="rounded border px-3 py-2" style={{ borderColor: designTokens.border }}>
                    Page content region
                  </section>
                </main>
                {shell.regions.bottomNavigation ? (
                  <nav className="rounded border px-3 py-2" style={{ borderColor: designTokens.border }}>
                    Bottom navigation
                  </nav>
                ) : null}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <div
        className="grid min-h-[34rem] overflow-hidden border"
        style={{
          borderColor: designTokens.border,
          borderRadius: designTokens.radius,
          gap: designTokens.space,
          gridTemplateColumns: "repeat(${gridColumns}, minmax(0, 1fr))",
          gridTemplateRows: "repeat(${gridRows}, minmax(3rem, auto))",
          padding: designTokens.space,
        }}
      >
        {layoutRegions.map((region) => (
          <article
            key={region.id}
            aria-label={region.label}
            role={region.role}
            className="border text-sm shadow-sm"
            style={{
              backgroundColor:
                region.tone === "accent" ? designTokens.accent : designTokens[region.tone],
              borderColor: designTokens.border,
              borderRadius: designTokens.radius,
              color:
                region.tone === "accent"
                  ? designTokens.accentForeground
                  : designTokens.foreground,
              gridColumn: region.gridColumn,
              gridRow: region.gridRow,
              padding: designTokens.space,
            }}
          >
            <p className="text-xs font-medium uppercase">{region.kind}</p>
            <h2 className="mt-2 font-semibold">{region.label}</h2>
            <p className="mt-1 text-xs opacity-80">{region.guidance}</p>
            <p className="mt-3 text-[11px] opacity-70">{region.meta}</p>
            {renderPrimitiveBody(region, designTokens)}
          </article>
        ))}
      </div>
    </section>
  );
}

function renderPrimitiveBody(region, tokens) {
  const primitive = region.primitive || region.kind || "section";
  const componentRole = region.componentRole || primitive;
  const label = formatPrimitiveLabel(primitive);
  const roleLabel = formatPrimitiveLabel(componentRole);

  if (region.kind === "dialog-panel" || primitive === "dialog-panel") {
    return (
      <div
        className="mt-3 rounded border p-3 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby={region.id + "-title"}
        style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p id={region.id + "-title"} className="text-sm font-semibold">
              {formatPrimitiveLabel(region.modalType || "dialog")}
            </p>
            <p className="mt-1 text-[11px] opacity-70">
              Floating modal surface with grouped content and focus management.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            className="rounded border px-2 py-1 text-[11px]"
            style={{ borderColor: tokens.border }}
          >
            Close
          </button>
        </div>
        <div className="mt-3 grid gap-2">
          <span className="h-2 w-10/12 rounded-full" style={{ backgroundColor: tokens.border }} />
          <span className="h-2 w-7/12 rounded-full" style={{ backgroundColor: tokens.border }} />
          <button
            type="button"
            className="mt-2 w-fit rounded px-3 py-2 text-xs font-medium"
            style={{ backgroundColor: tokens.accent, color: tokens.accentForeground }}
          >
            Primary action
          </button>
        </div>
      </div>
    );
  }

  if (region.kind === "repeated-list" || primitive === "list-item") {
    return (
      <ul className="mt-3 space-y-2" aria-label={region.label}>
        {Array.from({ length: Math.max(1, region.itemCount ?? 3) }).map((_, itemIndex) => (
          <li
            key={itemIndex}
            className="rounded border px-2 py-1 text-xs"
            style={{ borderColor: tokens.border, backgroundColor: tokens.muted }}
          >
            Row {itemIndex + 1} - repeated item scaffold
          </li>
        ))}
      </ul>
    );
  }

  if (region.kind === "repeated-grid" || primitive === "card-grid") {
    return (
      <div
        className="mt-3 grid gap-2"
        style={{
          gridTemplateColumns: "repeat(" + Math.max(1, region.columns ?? 2) + ", minmax(0, 1fr))",
        }}
        aria-label={region.label}
      >
        {Array.from({ length: Math.max(1, region.itemCount ?? 4) }).map((_, itemIndex) => (
          <article
            key={itemIndex}
            className="rounded border p-2 text-xs"
            style={{ borderColor: tokens.border, backgroundColor: tokens.muted }}
          >
            <p className="font-medium">Card {itemIndex + 1}</p>
            <span className="mt-2 block h-2 w-8/12 rounded-full" style={{ backgroundColor: tokens.border }} />
          </article>
        ))}
      </div>
    );
  }

  if (region.kind === "stat-row" || primitive === "stat-row") {
    const cards = Math.max(2, region.cardCount ?? region.itemCount ?? 3);
    return (
      <div
        className="mt-3 grid gap-2"
        style={{
          gridTemplateColumns: "repeat(" + cards + ", minmax(0, 1fr))",
        }}
        aria-label={region.label + " KPI cards"}
      >
        {Array.from({ length: cards }).map((_, itemIndex) => (
          <article
            key={itemIndex}
            className="rounded border p-3 text-xs"
            style={{ borderColor: tokens.border, backgroundColor: tokens.muted }}
          >
            <p className="text-[11px] uppercase opacity-70">Metric {itemIndex + 1}</p>
            <p className="mt-1 text-xl font-semibold">{["12,340", "$45.2K", "+18%", "573"][itemIndex % 4]}</p>
            <p className="mt-1 text-[11px] opacity-70">Trend context</p>
          </article>
        ))}
      </div>
    );
  }

  if (region.kind === "form-group" || primitive === "form-group") {
    return (
      <form className="mt-3 grid gap-2" aria-label={region.label}>
        {Array.from({ length: Math.max(1, region.fieldCount ?? 2) }).map((_, itemIndex) => (
          <label key={itemIndex} className="grid gap-1 text-[11px] font-medium">
            Field {itemIndex + 1}
            <span
              className="flex min-h-9 items-center rounded border px-3 font-normal opacity-75"
              style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}
            >
              Value or input
            </span>
          </label>
        ))}
        <button
          type="button"
          className="mt-1 w-fit rounded px-3 py-2 text-xs font-medium"
          style={{ backgroundColor: tokens.accent, color: tokens.accentForeground }}
        >
          Submit action
        </button>
      </form>
    );
  }

  if (region.kind === "data-table" || primitive === "data-table") {
    const rows = Math.max(2, region.rows ?? 3);
    const columns = Math.max(2, region.columns ?? 3);
    return (
      <div className="mt-3 overflow-x-auto" aria-label={region.label}>
        <table className="w-full min-w-[28rem] border-collapse text-left text-xs">
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <th
                  key={columnIndex}
                  className="border-b px-2 py-1.5 font-semibold"
                  style={{ borderColor: tokens.border }}
                >
                  Column {columnIndex + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, columnIndex) => (
                  <td
                    key={columnIndex}
                    className="border-b px-2 py-1.5"
                    style={{ borderColor: tokens.border }}
                  >
                    Cell {rowIndex + 1}.{columnIndex + 1}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (region.kind === "chart-series" || primitive === "chart-series") {
    const bars = Math.max(3, region.seriesCount ?? region.itemCount ?? 5);
    const heights = [42, 74, 55, 88, 63, 78, 48, 92];
    return (
      <div
        className="mt-3 grid min-h-32 items-end gap-2 rounded border p-3"
        style={{
          borderColor: tokens.border,
          gridTemplateColumns: "repeat(" + bars + ", minmax(0, 1fr))",
        }}
        aria-label={region.label + " bar chart preview"}
      >
        {Array.from({ length: bars }).map((_, index) => (
          <span
            key={index}
            className="rounded-t"
            style={{
              height: heights[index % heights.length] + "%",
              backgroundColor: tokens.accent,
            }}
          />
        ))}
      </div>
    );
  }

  if (region.kind === "tab-set" || primitive === "tab-set") {
    const tabs = Math.max(2, region.tabCount ?? region.itemCount ?? 3);
    const selectedIndex = Math.min(tabs - 1, Math.max(0, region.selectedIndex ?? 0));
    return (
      <div className="mt-3 grid gap-2" aria-label={region.label + " tabs"}>
        <div
          role="tablist"
          aria-label={region.label}
          className="flex w-fit flex-wrap gap-1 rounded-full border p-1"
          style={{ borderColor: tokens.border, backgroundColor: tokens.muted }}
        >
          {Array.from({ length: tabs }).map((_, index) => {
            const selected = index === selectedIndex;
            return (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={selected}
                className="rounded-full px-3 py-1.5 text-xs font-medium"
                style={{
                  backgroundColor: selected ? tokens.accent : tokens.surface,
                  color: selected ? tokens.accentForeground : tokens.foreground,
                }}
              >
                Tab {index + 1}
              </button>
            );
          })}
        </div>
        <section
          role="tabpanel"
          className="rounded border p-3 text-xs"
          style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}
        >
          {formatPrimitiveLabel(region.tabKind || "tabs")} panel {selectedIndex + 1}
        </section>
      </div>
    );
  }

  if (region.kind === "action-cluster" || primitive === "action-cluster") {
    const controls = Math.max(2, region.controlCount ?? region.itemCount ?? 3);
    const clusterType = region.clusterType || "toolbar";
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2" aria-label={region.label + " controls"}>
        {Array.from({ length: controls }).map((_, index) => (
          <button
            key={index}
            type="button"
            className={clusterType === "segmented-control" ? "rounded-full border px-3 py-1.5 text-xs" : "rounded px-3 py-2 text-xs font-medium"}
            style={{
              borderColor: tokens.border,
              backgroundColor: index === 0 ? tokens.accent : tokens.surface,
              color: index === 0 ? tokens.accentForeground : tokens.foreground,
            }}
          >
            Action {index + 1}
          </button>
        ))}
      </div>
    );
  }

  if (/header|nav/.test(primitive)) {
    return (
      <nav className="mt-3 flex flex-wrap items-center gap-2" aria-label={region.label}>
        {["Overview", "Workflows", "Settings"].map((item) => (
          <span
            key={item}
            className="rounded-full border px-2 py-1 text-[11px]"
            style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}
          >
            {item}
          </span>
        ))}
      </nav>
    );
  }

  if (/field|action|button|input|control/.test(primitive)) {
    if (componentRole === "search-field") {
      return (
        <div className="mt-3 flex min-h-10 items-center gap-2 rounded-full border px-3 text-xs" style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}>
          <span aria-hidden="true">/</span>
          <span className="opacity-70">Search or filter...</span>
        </div>
      );
    }

    if (componentRole === "primary-action" || componentRole === "icon-action") {
      return (
        <button type="button" className="mt-3 rounded px-3 py-2 text-xs font-medium" style={{ backgroundColor: tokens.accent, color: tokens.accentForeground }}>
          {roleLabel}
        </button>
      );
    }

    return (
      <div className="mt-3 grid gap-2" aria-label={label + " primitive preview"}>
        <label className="text-[11px] font-medium opacity-75">{roleLabel}</label>
        <div className="flex min-h-9 items-center justify-between rounded border px-3 text-xs" style={{ borderColor: tokens.border }}>
          <span className="opacity-70">User input or action</span>
          <button type="button" className="rounded px-2 py-1 text-[11px]" style={{ backgroundColor: tokens.accent, color: tokens.accentForeground }}>
            Apply
          </button>
        </div>
      </div>
    );
  }

  if (/card|panel/.test(primitive)) {
    if (componentRole === "metric-card") {
      return (
        <div className="mt-3 rounded border p-3" style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}>
          <p className="text-[11px] uppercase opacity-70">Metric</p>
          <p className="mt-1 text-2xl font-semibold">12,340</p>
          <p className="mt-1 text-[11px] opacity-70">Trend and supporting context</p>
        </div>
      );
    }

    return (
      <div className="mt-3 rounded border p-3" style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}>
        <p className="text-xs font-semibold">{roleLabel}</p>
        <p className="mt-1 text-[11px] opacity-70">Card scaffold with grouped title, content, and supporting metadata.</p>
      </div>
    );
  }

  if (/media|chart/.test(primitive) || componentRole === "chart-panel") {
    return (
      <div className="mt-3 grid min-h-24 grid-cols-5 items-end gap-1 rounded border p-3" style={{ borderColor: tokens.border }}>
        {[35, 70, 50, 88, 60].map((height, index) => (
          <span key={index} className="rounded-t" style={{ height: height + "%", backgroundColor: tokens.accent }} />
        ))}
      </div>
    );
  }

  if (/text|list/.test(primitive)) {
    return (
      <div className="mt-3 space-y-1.5" aria-label={label + " text scaffold"}>
        <span className="block h-2 w-10/12 rounded-full" style={{ backgroundColor: tokens.border }} />
        <span className="block h-2 w-8/12 rounded-full" style={{ backgroundColor: tokens.border }} />
      </div>
    );
  }

  return (
    <div className="mt-3 rounded border p-2 text-[11px] opacity-80" style={{ borderColor: tokens.border }}>
      Component primitive: {label}
    </div>
  );
}

function formatPrimitiveLabel(value) {
  return String(value || "section")
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}`;
}

function buildGeneratedTokenBlueprint(designTokens) {
  return {
    surface: designTokens.surface,
    foreground: designTokens.foreground,
    accent: designTokens.accent,
    accentForeground: designTokens.accentForeground ?? designTokens.foreground,
    muted: designTokens.muted,
    border: designTokens.border,
    space: TOKEN_SPACING_VALUES[designTokens.spacing] ?? TOKEN_SPACING_VALUES.cozy,
    radius: TOKEN_RADIUS_VALUES[designTokens.radius] ?? TOKEN_RADIUS_VALUES.md,
  };
}

function buildGeneratedRegionBlueprint(inspection, archetype) {
  const patternRegions = buildRegionsFromLayoutPatterns(inspection);
  const detectedRegions = buildRegionsFromDetectedElements(inspection).filter(
    (region) => !isRegionCoveredByPattern(region, patternRegions),
  );
  const regions =
    patternRegions.length || detectedRegions.length
      ? [...patternRegions, ...detectedRegions].slice(0, 8)
      : inspection.layout.regions.slice(0, 8);
  const sourceRegions = regions.length
    ? regions
    : [
        {
          kind: "content panel",
          minColumn: 0,
          maxColumn: inspection.layout.gridColumns - 1,
          minRow: 0,
          maxRow: Math.max(0, Math.min(inspection.layout.gridRows - 1, 3)),
          widthCells: inspection.layout.gridColumns,
          heightCells: Math.max(1, Math.min(inspection.layout.gridRows, 4)),
        },
      ];

  return sourceRegions.map((region, index) => {
    const kind = region.kind || "content panel";
    const rowStart = region.minRow + 1;
    const columnStart = region.minColumn + 1;
    const rowSpan = Math.max(1, region.heightCells || region.maxRow - region.minRow + 1);
    const columnSpan = Math.max(1, region.widthCells || region.maxColumn - region.minColumn + 1);

    return {
      id: `region-${index + 1}`,
      kind,
      label: `${titleCase(kind)} ${index + 1}`,
      role: GENERATED_REGION_ROLES[kind] ?? "region",
      tone: GENERATED_REGION_TONES[kind] ?? "muted",
      guidance: GENERATED_REGION_GUIDANCE[kind] ?? archetype.layout,
      primitive: region.primitive ?? kind,
      componentRole: region.componentRole ?? region.primitive ?? kind,
      confidence: region.confidence ?? region.patternConfidence ?? null,
      meta: `Rows ${region.minRow + 1}-${region.maxRow + 1}, columns ${
        region.minColumn + 1
      }-${region.maxColumn + 1}${
        typeof (region.confidence ?? region.patternConfidence) === "number"
          ? `, confidence ${Math.round((region.confidence ?? region.patternConfidence) * 100)}%`
          : ""
      }`,
      gridColumn: `${columnStart} / span ${columnSpan}`,
      gridRow: `${rowStart} / span ${rowSpan}`,
      ...(region.itemCount ? { itemCount: region.itemCount } : {}),
      ...(region.cardCount ? { cardCount: region.cardCount } : {}),
      ...(region.rows ? { rows: region.rows } : {}),
      ...(region.columns ? { columns: region.columns } : {}),
      ...(region.fieldCount ? { fieldCount: region.fieldCount } : {}),
      ...(region.actionCount ? { actionCount: region.actionCount } : {}),
      ...(region.chartKind ? { chartKind: region.chartKind } : {}),
      ...(region.seriesCount ? { seriesCount: region.seriesCount } : {}),
      ...(region.clusterType ? { clusterType: region.clusterType } : {}),
      ...(region.controlCount ? { controlCount: region.controlCount } : {}),
      ...(region.tabKind ? { tabKind: region.tabKind } : {}),
      ...(region.tabCount ? { tabCount: region.tabCount } : {}),
      ...(Number.isInteger(region.selectedIndex) ? { selectedIndex: region.selectedIndex } : {}),
      ...(region.modalType ? { modalType: region.modalType } : {}),
      ...(region.childCount ? { childCount: region.childCount } : {}),
      ...(typeof region.centeredness === "number" ? { centeredness: region.centeredness } : {}),
      ...(region.patternConfidence ? { patternConfidence: region.patternConfidence } : {}),
    };
  });
}

function buildGeneratedPatternBlueprint(inspection) {
  const patterns = inspection.layoutTree?.patterns ?? {};
  return {
    textLines: patterns.textLines ?? inspection.quality?.patterns?.textLines ?? 0,
    appShells: (patterns.appShells ?? []).slice(0, 2).map((pattern, index) => ({
      id: pattern.id ?? `app-shell-${index + 1}`,
      axis: pattern.axis ?? "landmarks",
      shellType: pattern.shellType ?? "navigation-shell",
      confidence: pattern.confidence ?? 0.5,
      navCount: pattern.navCount ?? pattern.children?.length ?? 0,
      regions: pattern.regions ?? {},
      children: pattern.children ?? [],
    })),
    repeatedLists: (patterns.repeatedLists ?? []).slice(0, 4).map((pattern, index) => ({
      id: pattern.id ?? `repeated-list-${index + 1}`,
      axis: pattern.axis ?? "vertical",
      confidence: pattern.confidence ?? 0.5,
      rhythm: pattern.rhythm ?? null,
      itemCount: pattern.children?.length ?? 0,
      children: pattern.children ?? [],
    })),
    repeatedGrids: (patterns.repeatedGrids ?? []).slice(0, 4).map((pattern, index) => ({
      id: pattern.id ?? `repeated-grid-${index + 1}`,
      axis: pattern.axis ?? "grid",
      confidence: pattern.confidence ?? 0.5,
      rhythm: pattern.rhythm ?? null,
      rows: pattern.rows ?? 1,
      columns: pattern.columns ?? 1,
      itemCount: pattern.children?.length ?? 0,
      children: pattern.children ?? [],
    })),
    statRows: (patterns.statRows ?? []).slice(0, 4).map((pattern, index) => ({
      id: pattern.id ?? `stat-row-${index + 1}`,
      axis: pattern.axis ?? "horizontal",
      confidence: pattern.confidence ?? 0.5,
      rhythm: pattern.rhythm ?? null,
      cardCount: pattern.cardCount ?? pattern.children?.length ?? 0,
      children: pattern.children ?? [],
    })),
    formGroups: (patterns.formGroups ?? []).slice(0, 4).map((pattern, index) => ({
      id: pattern.id ?? `form-group-${index + 1}`,
      axis: pattern.axis ?? "vertical",
      confidence: pattern.confidence ?? 0.5,
      rhythm: pattern.rhythm ?? null,
      fieldCount: pattern.fieldCount ?? 0,
      actionCount: pattern.actionCount ?? 0,
      children: pattern.children ?? [],
    })),
    dataTables: (patterns.dataTables ?? []).slice(0, 4).map((pattern, index) => ({
      id: pattern.id ?? `data-table-${index + 1}`,
      axis: pattern.axis ?? "rows-columns",
      confidence: pattern.confidence ?? 0.5,
      rhythm: pattern.rhythm ?? null,
      rows: pattern.rows ?? 0,
      columns: pattern.columns ?? 0,
      children: pattern.children ?? [],
    })),
    charts: (patterns.charts ?? []).slice(0, 4).map((pattern, index) => ({
      id: pattern.id ?? `chart-series-${index + 1}`,
      axis: pattern.axis ?? "x-series",
      chartKind: pattern.chartKind ?? "bar",
      confidence: pattern.confidence ?? 0.5,
      rhythm: pattern.rhythm ?? null,
      seriesCount: pattern.seriesCount ?? pattern.children?.length ?? 0,
      children: pattern.children ?? [],
    })),
    actionClusters: (patterns.actionClusters ?? []).slice(0, 4).map((pattern, index) => ({
      id: pattern.id ?? `action-cluster-${index + 1}`,
      axis: pattern.axis ?? "horizontal",
      clusterType: pattern.clusterType ?? "toolbar",
      confidence: pattern.confidence ?? 0.5,
      rhythm: pattern.rhythm ?? null,
      controlCount: pattern.controlCount ?? pattern.children?.length ?? 0,
      children: pattern.children ?? [],
    })),
    tabSets: (patterns.tabSets ?? []).slice(0, 4).map((pattern, index) => ({
      id: pattern.id ?? `tab-set-${index + 1}`,
      axis: pattern.axis ?? "horizontal",
      tabKind: pattern.tabKind ?? "tabs",
      confidence: pattern.confidence ?? 0.5,
      rhythm: pattern.rhythm ?? null,
      tabCount: pattern.tabCount ?? pattern.children?.length ?? 0,
      selectedIndex: pattern.selectedIndex ?? 0,
      children: pattern.children ?? [],
    })),
    dialogPanels: (patterns.dialogPanels ?? []).slice(0, 4).map((pattern, index) => ({
      id: pattern.id ?? `dialog-panel-${index + 1}`,
      axis: pattern.axis ?? "overlay",
      modalType: pattern.modalType ?? "centered-dialog",
      confidence: pattern.confidence ?? 0.5,
      childCount: pattern.childCount ?? Math.max(0, (pattern.children?.length ?? 1) - 1),
      centeredness: pattern.centeredness ?? null,
      children: pattern.children ?? [],
    })),
  };
}

function buildGeneratedResponsiveBlueprint(inspection) {
  const responsive = inspection.layoutTree?.responsive ?? inspection.quality?.responsive;
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

function buildGeneratedScreenIntentBlueprint(inspection) {
  const intent = inspection.layoutTree?.screenIntent ?? inspection.quality?.screenIntent;
  return {
    id: intent?.id ?? "dashboard",
    label: intent?.label ?? "Dashboard or analytics workspace",
    confidence: intent?.confidence ?? 0.55,
    evidence: intent?.evidence ?? [],
    scores: intent?.scores ?? {},
  };
}

function buildGeneratedElementBlueprint(inspection) {
  return (inspection.elements ?? []).slice(0, 12).map((element) => ({
    id: element.id,
    kind: element.kind,
    primitive: element.primitive,
    componentRole: element.componentRole,
    confidence: element.confidence,
    box: element.box,
    signals: {
      textLineScore: element.signals?.textLineScore,
      repeatedPattern: element.signals?.repeatedPattern,
      componentRole: element.signals?.componentRole,
    },
  }));
}

function buildRegionsFromLayoutPatterns(inspection) {
  const repeatedLists = inspection.layoutTree?.patterns?.repeatedLists ?? [];
  const repeatedGrids = inspection.layoutTree?.patterns?.repeatedGrids ?? [];
  const statRows = inspection.layoutTree?.patterns?.statRows ?? [];
  const formGroups = inspection.layoutTree?.patterns?.formGroups ?? [];
  const dataTables = inspection.layoutTree?.patterns?.dataTables ?? [];
  const charts = inspection.layoutTree?.patterns?.charts ?? [];
  const actionClusters = inspection.layoutTree?.patterns?.actionClusters ?? [];
  const tabSets = inspection.layoutTree?.patterns?.tabSets ?? [];
  const dialogPanels = inspection.layoutTree?.patterns?.dialogPanels ?? [];
  if (
    !repeatedLists.length &&
    !repeatedGrids.length &&
    !statRows.length &&
    !formGroups.length &&
    !dataTables.length &&
    !charts.length &&
    !actionClusters.length &&
    !tabSets.length &&
    !dialogPanels.length
  ) {
    return [];
  }

  const dialogRegions = dialogPanels.slice(0, 4).map((pattern) => {
    const region = sourceBoxToGridRegion(pattern.box, inspection);
    return {
      ...region,
      kind: "dialog-panel",
      primitive: "dialog-panel",
      componentRole: "dialog-panel",
      modalType: pattern.modalType ?? "centered-dialog",
      childCount: pattern.childCount ?? Math.max(0, (pattern.children?.length ?? 1) - 1),
      centeredness: pattern.centeredness ?? null,
      itemCount: pattern.children?.length ?? 0,
      patternConfidence: pattern.confidence,
    };
  });

  const listRegions = repeatedLists.slice(0, 4).map((pattern) => {
    const region = sourceBoxToGridRegion(pattern.box, inspection);
    return {
      ...region,
      kind: "repeated-list",
      primitive: "list-item",
      componentRole: "list-row",
      itemCount: pattern.children?.length ?? 0,
      patternConfidence: pattern.confidence,
    };
  });
  const gridRegions = repeatedGrids.slice(0, 4).map((pattern) => {
    const region = sourceBoxToGridRegion(pattern.box, inspection);
    return {
      ...region,
      kind: "repeated-grid",
      primitive: "card-grid",
      componentRole: "card-grid",
      itemCount: pattern.children?.length ?? 0,
      rows: pattern.rows ?? 1,
      columns: pattern.columns ?? 1,
      patternConfidence: pattern.confidence,
    };
  });
  const statRegions = statRows.slice(0, 4).map((pattern) => {
    const region = sourceBoxToGridRegion(pattern.box, inspection);
    return {
      ...region,
      kind: "stat-row",
      primitive: "stat-row",
      componentRole: "stat-row",
      cardCount: pattern.cardCount ?? pattern.children?.length ?? 0,
      itemCount: pattern.children?.length ?? 0,
      patternConfidence: pattern.confidence,
    };
  });
  const formRegions = formGroups.slice(0, 4).map((pattern) => {
    const region = sourceBoxToGridRegion(pattern.box, inspection);
    return {
      ...region,
      kind: "form-group",
      primitive: "form-group",
      componentRole: "form-group",
      fieldCount: pattern.fieldCount ?? 0,
      actionCount: pattern.actionCount ?? 0,
      patternConfidence: pattern.confidence,
    };
  });
  const tableRegions = dataTables.slice(0, 4).map((pattern) => {
    const region = sourceBoxToGridRegion(pattern.box, inspection);
    return {
      ...region,
      kind: "data-table",
      primitive: "data-table",
      componentRole: "data-table",
      rows: pattern.rows ?? 0,
      columns: pattern.columns ?? 0,
      itemCount: pattern.children?.length ?? 0,
      patternConfidence: pattern.confidence,
    };
  });
  const chartRegions = charts.slice(0, 4).map((pattern) => {
    const region = sourceBoxToGridRegion(pattern.box, inspection);
    return {
      ...region,
      kind: "chart-series",
      primitive: "chart-series",
      componentRole: "chart-series",
      chartKind: pattern.chartKind ?? "bar",
      seriesCount: pattern.seriesCount ?? pattern.children?.length ?? 0,
      itemCount: pattern.children?.length ?? 0,
      patternConfidence: pattern.confidence,
    };
  });
  const actionRegions = actionClusters.slice(0, 4).map((pattern) => {
    const region = sourceBoxToGridRegion(pattern.box, inspection);
    return {
      ...region,
      kind: "action-cluster",
      primitive: "action-cluster",
      componentRole: "action-cluster",
      clusterType: pattern.clusterType ?? "toolbar",
      controlCount: pattern.controlCount ?? pattern.children?.length ?? 0,
      itemCount: pattern.children?.length ?? 0,
      patternConfidence: pattern.confidence,
    };
  });
  const tabRegions = tabSets.slice(0, 4).map((pattern) => {
    const region = sourceBoxToGridRegion(pattern.box, inspection);
    return {
      ...region,
      kind: "tab-set",
      primitive: "tab-set",
      componentRole: "tab-set",
      tabKind: pattern.tabKind ?? "tabs",
      tabCount: pattern.tabCount ?? pattern.children?.length ?? 0,
      selectedIndex: pattern.selectedIndex ?? 0,
      itemCount: pattern.children?.length ?? 0,
      patternConfidence: pattern.confidence,
    };
  });

  return [
    ...dialogRegions,
    ...tableRegions,
    ...chartRegions,
    ...tabRegions,
    ...actionRegions,
    ...listRegions,
    ...statRegions,
    ...gridRegions,
    ...formRegions,
  ];
}

function buildRegionsFromDetectedElements(inspection) {
  const elements = inspection.elements ?? [];
  if (!elements.length) return [];

  return elements.slice(0, 8).map((element) => {
    const region = sourceBoxToGridRegion(element.box, inspection);

    return {
      kind: element.kind,
      primitive: element.primitive ?? element.kind,
      componentRole: element.componentRole ?? element.primitive ?? element.kind,
      ...region,
      confidence: element.confidence,
    };
  });
}

function sourceBoxToGridRegion(box, inspection) {
  const safeBox = box ?? { x: 0, y: 0, width: 1, height: 1 };
  const sample = inspection.sample;
  const gridColumns = inspection.layout.gridColumns;
  const gridRows = inspection.layout.gridRows;
  const minColumn = clampGridIndex(
    Math.floor((safeBox.x / Math.max(1, sample.sourceWidth)) * gridColumns),
    gridColumns,
  );
  const maxColumn = clampGridIndex(
    Math.ceil(((safeBox.x + safeBox.width) / Math.max(1, sample.sourceWidth)) * gridColumns) - 1,
    gridColumns,
  );
  const minRow = clampGridIndex(
    Math.floor((safeBox.y / Math.max(1, sample.sourceHeight)) * gridRows),
    gridRows,
  );
  const maxRow = clampGridIndex(
    Math.ceil(((safeBox.y + safeBox.height) / Math.max(1, sample.sourceHeight)) * gridRows) - 1,
    gridRows,
  );

  return {
    minColumn,
    maxColumn: Math.max(minColumn, maxColumn),
    minRow,
    maxRow: Math.max(minRow, maxRow),
    widthCells: Math.max(1, maxColumn - minColumn + 1),
    heightCells: Math.max(1, maxRow - minRow + 1),
  };
}

function isRegionCoveredByPattern(region, patternRegions) {
  return patternRegions.some(
    (pattern) =>
      region.minRow >= pattern.minRow &&
      region.maxRow <= pattern.maxRow &&
      region.minColumn >= pattern.minColumn &&
      region.maxColumn <= pattern.maxColumn,
  );
}

function clampGridIndex(value, length) {
  return Math.min(Math.max(0, value), Math.max(0, length - 1));
}

function titleCase(value) {
  return String(value)
    .split(/[\s/-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function escapeGeneratedString(value) {
  return String(value || "uploaded-reference")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
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
 *   svgInspection?: ReturnType<import("./offline-svg-inspection.mjs").inspectSvgMarkup> | null;
 * }} file
 * @param {{ readableSize: string; dimensionLine: string | null }} context
 */
export function buildAdvancedOfflineOverrides(file, context) {
  const fileName = file.name || "uploaded-reference";
  const { archetype, confidence, formFactor } = classifyLayoutArchetype(file);
  const componentList = archetype.components.join(", ");
  const svgInspection = resolveSvgInspection(file);
  const inspectionSections = [
    ...buildImageInspectionPlanSections(file.offlineInspection),
    ...buildSvgInspectionPlanSections(svgInspection),
  ];

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
  const svgStats = buildSvgInspectionPreviewStats(svgInspection);
  /** @type {PreviewStat[]} */
  const previewStats =
    inspectionStats ??
    svgStats ?? [
      { label: "Sections", value: String(stats.sections) },
      { label: "Components", value: String(stats.components) },
      { label: "Breakpoints", value: String(stats.breakpoints) },
      { label: "Review Items", value: String(stats.reviewItems) },
    ];

  return {
    plan,
    previewStats,
    generatedCode: buildGeneratedCode(
      fileName,
      archetype,
      file.offlineInspection,
      svgInspection,
    ),
    summary: buildOfflineSummary({
      archetype,
      confidence,
      formFactor,
      offlineInspection: file.offlineInspection,
      svgInspection,
    }),
  };
}

function resolveSvgInspection(file) {
  return file.svgInspection ?? file.offlineInspection?.svgInspection ?? null;
}

function buildOfflineSummary({ archetype, confidence, formFactor, offlineInspection, svgInspection }) {
  const details = [];
  if (offlineInspection) {
    details.push(`local pixel signals (${offlineInspection.visualDensity} density)`);
  }
  if (svgInspection) {
    details.push(`local SVG structure (${svgInspection.labels.length} labels)`);
  }

  return `${archetype.label} scaffold (${Math.round(confidence * 100)}% confidence, ${
    formFactor.label
  })${details.length ? ` with ${details.join(" and ")}.` : "."}`;
}
