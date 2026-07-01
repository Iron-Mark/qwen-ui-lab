import {
  buildImageInspectionPlanSections,
  buildImageInspectionPreviewStats,
} from "./offline-image-inspection.mjs";
import {
  buildSvgInspectionPlanSections,
  buildSvgInspectionPreviewStats,
} from "./offline-svg-inspection.mjs";
import { normalizeGeneratedShadcnImports } from "./generated-imports.mjs";

/**
 * Advanced deterministic offline analysis — no AI, no network.
 * Combines known-sample registry, weighted archetype scoring, and form-factor signals.
 */

/** @typedef {{ title: string; body: string }} PlanSection */
/** @typedef {{ label: string; value: string }} PreviewStat */

/** Sample screenshots — exact filename match (normalized). */
export const KNOWN_SAMPLES = {
  "dashboard-reference.svg": {
    summary:
      "Admin dashboard shell with stat grid, revenue chart, and activity feed.",
    previewStats: [
      { label: "Sections", value: "6" },
      { label: "Components", value: "11" },
      { label: "Breakpoints", value: "3" },
      { label: "Review Items", value: "4" },
    ],
    plan: [
      {
        title: "Visual Input",
        body: "Dashboard sample screenshot: landscape admin dashboard layout.",
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
        body: "Verify spacing against the source screenshot, wire real API data, and swap chart libraries if product standards require it.",
      },
    ],
    generatedCode: `import { StatCard } from "@/features/home/components/StatCard";
import { RevenueCard } from "@/features/home/components/RevenueCard";
import { ChartPreview } from "@/features/home/components/ChartPreview";
import { ActivityList } from "@/features/home/components/ActivityList";

export function GeneratedDashboard() {
  return (
    <section aria-label="Dashboard export">
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
      "Centered sign-in screen with brand mark, email/password fields, OAuth row, and recovery links.",
    previewStats: [
      { label: "Sections", value: "4" },
      { label: "Components", value: "7" },
      { label: "Breakpoints", value: "2" },
      { label: "Review Items", value: "5" },
    ],
    plan: [
      {
        title: "Visual Input",
        body: "Sign-in sample screenshot: centered authentication card on a neutral canvas.",
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
        body: "Verify spacing against the source screenshot, wire real auth provider callbacks, and confirm password visibility toggle behavior.",
      },
    ],
    generatedCode: `import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextField } from "@/features/account/components/TextField";
import { PasswordField } from "@/features/account/components/PasswordField";
import { OAuthButtonRow } from "@/features/account/components/OAuthButtonRow";

export function GeneratedAuthScreen() {
  return (
    <main aria-label="Auth export" className="flex min-h-dvh items-center justify-center p-4">
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
      "Mobile app shell with sticky header, stacked feed cards, floating action button, and bottom navigation.",
    previewStats: [
      { label: "Sections", value: "4" },
      { label: "Components", value: "8" },
      { label: "Breakpoints", value: "2" },
      { label: "Review Items", value: "5" },
    ],
    plan: [
      {
        title: "Visual Input",
        body: "Mobile app sample screenshot: portrait phone frame around 390×844.",
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
    <div aria-label="Mobile export" className="relative flex min-h-dvh flex-col bg-background">
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
      "Marketing landing page with hero band, three-up feature grid, testimonial row, pricing cards, and footer CTA.",
    previewStats: [
      { label: "Sections", value: "5" },
      { label: "Components", value: "9" },
      { label: "Breakpoints", value: "3" },
      { label: "Review Items", value: "5" },
    ],
    plan: [
      {
        title: "Visual Input",
        body: "Landing page sample screenshot: wide marketing page around 1440×900.",
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
        body: "Verify hero copy hierarchy against the source screenshot, wire analytics on primary CTA, and validate responsive stacking at md/lg breakpoints.",
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
        aria-label="Landing hero"
        headline="Ship UI faster with AI-assisted scaffolding"
        primaryCta="Start free"
        secondaryCta="View sample"
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
      "Account settings panel with side nav, grouped profile fields, notification toggles, and sticky save bar.",
    previewStats: [
      { label: "Sections", value: "4" },
      { label: "Components", value: "6" },
      { label: "Breakpoints", value: "2" },
      { label: "Review Items", value: "4" },
    ],
    plan: [
      {
        title: "Visual Input",
        body: "Settings sample screenshot: desktop layout with left rail.",
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
        body: "Verify toggle defaults against the source screenshot, wire optimistic save feedback, and confirm mobile nav collapses to a sheet drawer.",
      },
    ],
    generatedCode: `import { SettingsNav } from "@/features/settings/components/SettingsNav";
import { FormSection } from "@/features/settings/components/FormSection";
import { ToggleRow } from "@/features/settings/components/ToggleRow";
import { SaveBar } from "@/features/settings/components/SaveBar";

export function GeneratedSettings() {
  return (
    <section aria-label="Settings export" className="grid gap-8 lg:grid-cols-[14rem_1fr]">
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
      "E-commerce catalog with filter sidebar, product grid, cart badge, and quick-add CTAs.",
    previewStats: [
      { label: "Sections", value: "5" },
      { label: "Components", value: "10" },
      { label: "Breakpoints", value: "3" },
      { label: "Review Items", value: "6" },
    ],
    plan: [
      {
        title: "Visual Input",
        body: "Shop catalog sample screenshot: desktop catalog with left filter rail.",
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
        body: "Verify filter state against the source screenshot, wire cart persistence, and validate grid reflow at sm/md/lg breakpoints.",
      },
    ],
    generatedCode: `import { ShopHeader } from "@/features/catalog/components/ShopHeader";
import { FilterSidebar } from "@/features/catalog/components/FilterSidebar";
import { ProductGrid } from "@/features/catalog/components/ProductGrid";
import { ProductCard } from "@/features/catalog/components/ProductCard";
import { CartDrawer } from "@/features/catalog/components/CartDrawer";

export function GeneratedCatalog() {
  return (
    <div aria-label="Catalog export" className="min-h-dvh bg-background">
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
  empty: {
    label: "Empty state / onboarding",
    keywords: [
      { term: "empty", weight: 3 },
      { term: "blank", weight: 2 },
      { term: "onboarding", weight: 2 },
      { term: "no results", weight: 3 },
      { term: "nothing", weight: 2 },
      { term: "upload", weight: 1 },
    ],
    layout:
      "centered empty-state layout with concise copy, one recovery action, and optional supporting illustration.",
    components: [
      "EmptyState",
      "StatusIcon",
      "SupportCopy",
      "PrimaryButton",
      "SecondaryLink",
    ],
    stats: { sections: 2, components: 5, breakpoints: 2, reviewItems: 4 },
    codeVariant: "empty",
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
  empty: "GeneratedEmptyState",
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
  "empty-state": "surface",
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
  "empty-state": "Centered empty or onboarding state; preserve concise copy and one clear recovery action.",
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
  "empty-state": "status",
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
  if (KNOWN_SAMPLES[key]) return buildProductionKnownSample(key);
  const stemKey = key.replace(/\.(png|jpe?g|webp)$/i, ".svg");
  return KNOWN_SAMPLES[stemKey] ? buildProductionKnownSample(stemKey) : null;
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

  return KNOWN_SAMPLES[bestMatch.sampleKey]
    ? buildProductionKnownSample(bestMatch.sampleKey)
    : null;
}

function buildProductionKnownSample(sampleKey) {
  const sample = KNOWN_SAMPLES[sampleKey];
  if (!sample) return null;

  return {
    ...sample,
    generatedCode: buildKnownSampleGeneratedCode(sampleKey, sample),
  };
}

function buildKnownSampleGeneratedCode(sampleKey, sample) {
  const profile = buildKnownSampleProfile(sampleKey, sample);

  return normalizeGeneratedShadcnImports(`import type { AriaRole } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DetectionElement = {
  id: string;
  kind: string;
  primitive: string;
  componentRole: string;
  label: string;
  confidence: number;
  reasons: string[];
};

type LayoutRegion = DetectionElement & {
  role: AriaRole;
  children: string[];
};

const designTokens = ${JSON.stringify(profile.designTokens, null, 2)};

const screenIntent = ${JSON.stringify(profile.screenIntent, null, 2)};

const responsiveIntent = ${JSON.stringify(profile.responsiveIntent, null, 2)};

const detectedElements: DetectionElement[] = ${JSON.stringify(profile.elements, null, 2)};

const layoutRegions: LayoutRegion[] = ${JSON.stringify(profile.layoutRegions, null, 2)};

const detectedPatterns = ${JSON.stringify(profile.detectedPatterns, null, 2)};

const shadcnPrimitiveMap: Record<string, string> = ${JSON.stringify(
    profile.primitiveMap,
    null,
    2,
  )};

const componentTargets = ${JSON.stringify(profile.componentTargets, null, 2)};

const reviewActions = ${JSON.stringify(profile.reviewActions, null, 2)};

export default function ${profile.componentName}() {
  return (
    <main
      aria-label="${profile.label} export"
      className="min-h-dvh bg-background text-foreground"
    >
      <section className="mx-auto grid w-full max-w-6xl gap-6 p-4 sm:p-6 lg:p-8">
        <header className="grid gap-4 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Export</Badge>
            <Badge variant="outline">{screenIntent.label}</Badge>
          </div>
          <div className="grid gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{screenIntent.label}</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Starter component translated from the screenshot structure. Replace sample copy,
              connect real data, and keep the recipe JSON beside this component during review.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {componentTargets.map((target) => (
              <Badge key={target} variant="outline">{target}</Badge>
            ))}
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="grid gap-4 sm:grid-cols-2">
            {layoutRegions.map((region) => (
              <RegionCard key={region.id} region={region} />
            ))}
          </div>
          <aside className="grid content-start gap-3 rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-sm font-medium">Implementation notes</p>
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Responsive mode</dt>
                <dd className="font-medium">{responsiveIntent.mode}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Breakpoints</dt>
                <dd className="font-medium">{responsiveIntent.breakpoints.join(" / ")}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Detected regions</dt>
                <dd className="font-medium">{layoutRegions.length}</dd>
              </div>
            </dl>
            <div className="grid gap-2 pt-2">
              {reviewActions.map((action) => (
                <Button key={action} type="button" variant="outline" className="justify-start">
                  {action}
                </Button>
              ))}
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}

function RegionCard({ region }: { region: LayoutRegion }) {
  const children = detectedElements.filter((element) => region.children.includes(element.id));
  const primitive = shadcnPrimitiveMap[region.componentRole] ?? "Card section";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{region.label}</CardTitle>
            <CardDescription>{primitive}</CardDescription>
          </div>
          <Badge variant="secondary">{Math.round(region.confidence * 100)}%</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid gap-2 rounded-lg border border-dashed p-3">
          {(children.length ? children : [region]).map((element) => (
            <ElementPreview key={element.id} element={element} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ElementPreview({ element }: { element: DetectionElement }) {
  return (
    <article className="rounded-md bg-muted/50 px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{element.label}</span>
        <Badge variant="outline">{element.componentRole}</Badge>
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {element.reasons.join(" ")}
      </p>
    </article>
  );
}
`);
}

function buildKnownSampleProfile(sampleKey, sample) {
  const archetypeId = inferKnownSampleArchetypeId(sampleKey);
  const archetype = LAYOUT_ARCHETYPES[archetypeId] ?? LAYOUT_ARCHETYPES.dashboard;
  const componentName =
    GENERATED_COMPONENT_NAMES[archetype.codeVariant] ?? GENERATED_COMPONENT_NAMES.dashboard;
  const elements = buildKnownSampleElements(archetypeId);
  const layoutRegions = elements.map((element) => ({
    ...element,
    role: roleForSamplePrimitive(element.componentRole),
    children: [element.id],
  }));

  return {
    label: archetype.label,
    componentName,
    componentTargets: archetype.components,
    designTokens: knownSampleDesignTokens(archetypeId),
    screenIntent: {
      id: archetypeId,
      label: archetype.label,
      confidence: 0.95,
      source: "sample-screenshot",
      reference: sampleKey,
    },
    responsiveIntent: knownSampleResponsiveIntent(archetypeId),
    elements,
    layoutRegions,
    detectedPatterns: buildKnownSamplePatterns(archetypeId, elements),
    primitiveMap: buildKnownSamplePrimitiveMap(elements),
    reviewActions: buildKnownSampleReviewActions(sample, archetype),
  };
}

function inferKnownSampleArchetypeId(sampleKey) {
  if (/auth/.test(sampleKey)) return "auth";
  if (/mobile/.test(sampleKey)) return "mobile";
  if (/landing/.test(sampleKey)) return "landing";
  if (/settings/.test(sampleKey)) return "settings";
  if (/ecommerce|shop|catalog/.test(sampleKey)) return "ecommerce";
  return "dashboard";
}

function buildKnownSampleElements(archetypeId) {
  const commonReason =
    "Sample screenshot metadata identifies this region; exported as an editable primitive.";
  const templates = {
    dashboard: [
      ["sample-nav", "navigation", "top-navigation", "Dashboard navigation"],
      ["sample-stat-row", "metrics", "stat-row", "Metric cards"],
      ["sample-chart", "analytics", "chart-panel", "Revenue chart"],
      ["sample-activity", "list", "repeated-list", "Activity feed"],
      ["sample-actions", "actions", "action-cluster", "Quick actions"],
    ],
    auth: [
      ["sample-brand", "header", "brand-header", "Brand header"],
      ["sample-form", "form", "form-group", "Credentials form"],
      ["sample-email", "field", "form-field", "Email field"],
      ["sample-password", "field", "form-field", "Password field"],
      ["sample-oauth", "actions", "action-cluster", "OAuth actions"],
      ["sample-recovery", "links", "link-row", "Recovery links"],
    ],
    mobile: [
      ["sample-mobile-header", "navigation", "top-navigation", "Mobile header"],
      ["sample-feed", "list", "repeated-list", "Stacked feed"],
      ["sample-fab", "actions", "primary-action", "Floating action"],
      ["sample-bottom-nav", "navigation", "bottom-navigation", "Bottom navigation"],
    ],
    landing: [
      ["sample-site-nav", "navigation", "top-navigation", "Site navigation"],
      ["sample-hero", "hero", "hero-section", "Hero section"],
      ["sample-features", "grid", "repeated-grid", "Feature grid"],
      ["sample-pricing", "pricing", "pricing-table", "Pricing table"],
      ["sample-footer", "cta", "action-cluster", "Footer CTA"],
    ],
    settings: [
      ["sample-settings-nav", "navigation", "side-navigation", "Settings navigation"],
      ["sample-profile", "form", "form-group", "Profile fields"],
      ["sample-toggles", "controls", "control-group", "Notification toggles"],
      ["sample-select", "field", "select-field", "Timezone select"],
      ["sample-save", "actions", "action-cluster", "Save bar"],
    ],
    ecommerce: [
      ["sample-shop-header", "navigation", "top-navigation", "Shop header"],
      ["sample-filters", "filters", "side-navigation", "Filter sidebar"],
      ["sample-products", "grid", "repeated-grid", "Product grid"],
      ["sample-card", "card", "product-card", "Product card"],
      ["sample-cart", "dialog", "dialog-panel", "Cart drawer"],
      ["sample-checkout", "steps", "stepper", "Checkout steps"],
    ],
  };

  return (templates[archetypeId] ?? templates.dashboard).map(
    ([id, kind, componentRole, label], index) => ({
      id,
      kind,
      primitive: componentRole,
      componentRole,
      label,
      confidence: Math.max(0.78, 0.95 - index * 0.03),
      reasons: [
        commonReason,
        `${titleCase(componentRole)} maps to ${samplePrimitiveName(componentRole)}.`,
      ],
    }),
  );
}

function buildKnownSamplePatterns(archetypeId, elements) {
  const byRole = (matcher) =>
    elements.filter((element) => matcher(element.componentRole)).map((element) => element.id);
  const appShellChildren = byRole((role) => /navigation|header|shell/.test(role));
  const listChildren = byRole((role) => /list/.test(role));
  const gridChildren = byRole((role) => /grid|card|pricing/.test(role));
  const formChildren = byRole((role) => /form|field|select|control/.test(role));
  const dialogChildren = byRole((role) => /dialog|drawer/.test(role));
  const actionChildren = byRole((role) => /action|cta|oauth|save/.test(role));
  const chartChildren = byRole((role) => /chart|analytics/.test(role));
  const statChildren = byRole((role) => /stat|metric/.test(role));
  const tableChildren = byRole((role) => /table/.test(role));

  return {
    textLines: elements.length * 2,
    appShells: appShellChildren.length
      ? [{ id: `${archetypeId}-sample-shell`, children: appShellChildren, confidence: 0.92 }]
      : [],
    repeatedLists: listChildren.length
      ? [{ id: `${archetypeId}-sample-list`, children: listChildren, confidence: 0.9 }]
      : [],
    repeatedGrids: gridChildren.length
      ? [{ id: `${archetypeId}-sample-grid`, children: gridChildren, confidence: 0.9 }]
      : [],
    statRows: statChildren.length
      ? [{ id: `${archetypeId}-sample-stats`, children: statChildren, confidence: 0.88 }]
      : [],
    formGroups: formChildren.length
      ? [{ id: `${archetypeId}-sample-form`, children: formChildren, confidence: 0.9 }]
      : [],
    dataTables: tableChildren.length
      ? [{ id: `${archetypeId}-sample-data`, children: tableChildren, confidence: 0.75 }]
      : [],
    charts: chartChildren.length
      ? [{ id: `${archetypeId}-sample-chart`, children: chartChildren, confidence: 0.9 }]
      : [],
    actionClusters: actionChildren.length
      ? [{ id: `${archetypeId}-sample-actions`, children: actionChildren, confidence: 0.9 }]
      : [],
    tabSets: [],
    dialogPanels: dialogChildren.length
      ? [{ id: `${archetypeId}-sample-dialog`, children: dialogChildren, confidence: 0.86 }]
      : [],
    emptyStates: [],
  };
}

function buildKnownSamplePrimitiveMap(elements) {
  const map = {
    "action-cluster": "Button group inside Card footer",
    "bottom-navigation": "semantic nav with Button icon controls",
    "brand-header": "Card header with logo and heading",
    "chart-panel": "Card with chart placeholder and text summary",
    "control-group": "fieldset with switch-style controls",
    "dialog-panel": "Dialog or Sheet surface with focus management",
    "form-field": "Input with label, helper text, and validation slot",
    "form-group": "Card form section with grouped inputs",
    "hero-section": "section with heading, copy, and CTA Buttons",
    "link-row": "secondary navigation links",
    "pricing-table": "Card grid with plan actions",
    "primary-action": "Button with accessible label",
    "product-card": "Card with image, title, price, and add action",
    "repeated-grid": "responsive Card grid",
    "repeated-list": "list region with repeated rows",
    "select-field": "Select trigger with label and helper text",
    "side-navigation": "aside navigation with Button ghost controls",
    "stat-row": "metric Card grid",
    stepper: "ordered list with current-step state",
    "top-navigation": "semantic nav with Button links",
  };

  return Object.fromEntries(
    elements
      .map((element) => [element.componentRole, map[element.componentRole] ?? "Card section"])
      .sort(([first], [second]) => first.localeCompare(second)),
  );
}

function knownSampleDesignTokens(archetypeId) {
  const accent = {
    auth: "#2563eb",
    dashboard: "#3b82f6",
    ecommerce: "#0f766e",
    landing: "#7c3aed",
    mobile: "#0ea5e9",
    settings: "#4f46e5",
  }[archetypeId] ?? "#2563eb";

  return {
    surface: "#ffffff",
    foreground: "#111827",
    accent,
    accentForeground: "#ffffff",
    muted: "#f3f4f6",
    border: "#d1d5db",
    radius: "0.75rem",
    space: "1rem",
  };
}

function knownSampleResponsiveIntent(archetypeId) {
  const modes = {
    auth: "centered-form",
    dashboard: "desktop-dashboard",
    ecommerce: "sidebar-grid",
    landing: "marketing-stack",
    mobile: "mobile-shell",
    settings: "settings-sidebar",
  };

  return {
    mode: modes[archetypeId] ?? "responsive-page",
    breakpoints: archetypeId === "mobile" ? ["base", "sm"] : ["base", "md", "lg"],
    primaryFlow: "Review exported regions, replace sample content, then connect live data.",
  };
}

function buildKnownSampleReviewActions(sample, archetype) {
  return [
    "Replace sample content",
    "Wire real data",
    `Review ${archetype.stats.reviewItems} checklist items`,
  ].filter(Boolean);
}

function roleForSamplePrimitive(primitive) {
  if (/nav|header/.test(primitive)) return "navigation";
  if (/form|field|select|control/.test(primitive)) return "form";
  if (/dialog|drawer/.test(primitive)) return "dialog";
  if (/chart/.test(primitive)) return "figure";
  if (/list/.test(primitive)) return "list";
  return "region";
}

function samplePrimitiveName(primitive) {
  if (/button|action|cta|oauth|save/.test(primitive)) return "Button";
  if (/form|field|select|control/.test(primitive)) return "Input or Select";
  if (/nav/.test(primitive)) return "navigation";
  if (/dialog|drawer/.test(primitive)) return "Dialog";
  return "Card";
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
    <main aria-label="Auth export based on ${safeName}">
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
    <div aria-label="Mobile export based on ${safeName}" className="flex min-h-dvh flex-col">
      <header className="sticky top-0 border-b p-4">App header</header>
      <main className="flex-1 space-y-3 p-4">{/* stacked cards */}</main>
      <nav aria-label="Primary" className="border-t p-2">{/* bottom nav */}</nav>
    </div>
  );
}`;
    case "settings":
      return `export function GeneratedSettings() {
  return (
    <section aria-label="Settings export based on ${safeName}" className="grid gap-6 lg:grid-cols-[12rem_1fr]">
      <aside>{/* settings nav */}</aside>
      <form className="space-y-4">{/* grouped fields */}</form>
    </section>
  );
}`;
    case "modal":
      return `export function GeneratedDialogOverlay() {
  return (
    <Dialog defaultOpen>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Dialog title</DialogTitle>
          <DialogDescription>Detected modal body content.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button">Primary action</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}`;
    case "empty":
      return `import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function GeneratedEmptyState() {
  return (
    <main aria-label="Generated empty state" className="grid min-h-dvh place-items-center p-6">
      <Card className="grid max-w-md gap-3 p-6 text-center">
        <h1 className="text-xl font-semibold">No results yet</h1>
        <p className="text-sm text-muted-foreground">Connect real data, upload a source, or create the first item.</p>
        <Button type="button" className="mx-auto mt-2">Start now</Button>
      </Card>
    </main>
  );
}`;
    case "landing":
      return `export function GeneratedLanding() {
  return (
    <>
      <section aria-label="Generated hero" className="py-16 text-center">{/* hero */}</section>
      <section aria-label="Features" className="grid gap-6 md:grid-cols-3">{/* features */}</section>
    </>
  );
}`;
    case "ecommerce":
      return `export function GeneratedCatalog() {
  return (
    <div aria-label="Generated catalog" className="grid gap-6 lg:grid-cols-[14rem_1fr]">
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
    <section aria-label="Dashboard export based on ${safeName}">
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
  const designTokens = knownSampleDesignTokens(archetype.codeVariant);
  const detectedElements = buildGeneratedSvgElementBlueprint(labels);
  const layoutRegions = detectedElements.map((element) => ({
    ...element,
    role: roleForSamplePrimitive(element.componentRole),
    children: [element.id],
  }));
  const detectedPatterns = buildGeneratedSvgPatternBlueprint(detectedElements);
  const responsiveIntent = buildGeneratedSvgResponsiveBlueprint(svgInspection);
  const screenIntent = {
    id: archetype.codeVariant,
    label: archetype.label,
    confidence: 0.88,
    source: "offline-svg-structure",
    reference: safeName,
  };
  const primitiveMap = buildKnownSamplePrimitiveMap(detectedElements);
  const layoutClass =
    svgInspection.source.width && svgInspection.source.height && svgInspection.source.width < svgInspection.source.height
      ? "mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-4"
      : "grid gap-4 p-6 lg:grid-cols-[16rem_1fr]";

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

type SvgElement = {
  id: string;
  kind: string;
  primitive: string;
  componentRole: string;
  label: string;
  confidence: number;
  reasons: string[];
  guidance: string;
};

type SvgLayoutRegion = SvgElement & {
  role: AriaRole;
  children: string[];
};

const svgLabels = ${JSON.stringify(labels, null, 2)};

const svgStructure = ${JSON.stringify(stats, null, 2)};

const designTokens = ${JSON.stringify(designTokens, null, 2)};

const detectedElements: SvgElement[] = ${JSON.stringify(detectedElements, null, 2)};

const detectedPatterns = ${JSON.stringify(detectedPatterns, null, 2)};

const responsiveIntent = ${JSON.stringify(responsiveIntent, null, 2)};

const screenIntent = ${JSON.stringify(screenIntent, null, 2)};

const layoutRegions: SvgLayoutRegion[] = ${JSON.stringify(layoutRegions, null, 2)};

const shadcnPrimitiveMap: Record<string, string> = ${JSON.stringify(primitiveMap, null, 2)};

export default function ${componentName}() {
  return (
    <main
      aria-label="${archetype.label} export based on ${safeName}"
      className="min-h-dvh bg-background text-foreground"
    >
      <section className="mx-auto grid w-full max-w-6xl gap-6 p-4 sm:p-6 lg:p-8">
        <header className="grid gap-4 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">SVG export</Badge>
            <Badge variant="outline">{screenIntent.label}</Badge>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {svgLabels[0]?.label ?? screenIntent.label}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {svgStructure.shapeCount} vector shapes, {svgStructure.groupCount} groups, and{" "}
              {svgStructure.textCount} labels were parsed into reviewable regions.
            </p>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">ViewBox</dt>
              <dd className="font-medium">{svgStructure.viewBox}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Responsive mode</dt>
              <dd className="font-medium">{responsiveIntent.mode}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Regions</dt>
              <dd className="font-medium">{layoutRegions.length}</dd>
            </div>
          </dl>
        </header>

        <div className="${layoutClass}">
          <nav aria-label="SVG labels" className="grid content-start gap-2 rounded-xl border bg-card p-3">
            {svgLabels.slice(0, 6).map((item) => (
              <a key={item.id} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" href={"#" + item.id}>
                {item.label}
              </a>
            ))}
          </nav>
          <main className="grid gap-3">
            {layoutRegions.map((region) => (
              <SvgRegionCard key={region.id} region={region} />
            ))}
          </main>
        </div>
      </section>
    </main>
  );
}

function SvgRegionCard({ region }: { region: SvgLayoutRegion }) {
  const primitive = shadcnPrimitiveMap[region.componentRole] ?? "Card section";

  return (
    <Card id={region.id}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{region.label}</CardTitle>
            <CardDescription>{primitive}</CardDescription>
          </div>
          <Badge variant="outline">{Math.round(region.confidence * 100)}%</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="text-sm leading-6 text-muted-foreground">{region.guidance}</p>
        <SvgPrimitivePreview element={region} />
      </CardContent>
    </Card>
  );
}

function SvgPrimitivePreview({ element }: { element: SvgElement }) {
  if (element.componentRole === "form-field") {
    return <Input aria-label={element.label} placeholder={element.label} />;
  }

  if (element.componentRole === "primary-action") {
    return <Button type="button">{element.label}</Button>;
  }

  return (
    <div className="rounded-lg border border-dashed p-3 text-sm">
      <p className="font-medium">{element.label}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {element.reasons.join(" ")}
      </p>
    </div>
  );
}
`;
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
  return `Use this SVG label as copy or metadata inside the ${archetype.label.toLowerCase()} export.`;
}

function buildGeneratedSvgElementBlueprint(labels) {
  const roleMap = {
    action: "primary-action",
    content: "text-block",
    field: "form-field",
    section: "content-section",
  };

  return labels.map((item, index) => {
    const componentRole = roleMap[item.intent] ?? "content-section";
    return {
      id: item.id,
      kind: item.intent,
      primitive: componentRole,
      componentRole,
      label: item.label,
      confidence: Math.max(0.72, 0.9 - index * 0.02),
      reasons: [
        "SVG text and group labels define this region.",
        `${titleCase(item.intent)} label maps to ${samplePrimitiveName(componentRole)}.`,
      ],
      guidance: item.guidance,
    };
  });
}

function buildGeneratedSvgPatternBlueprint(elements) {
  const byRole = (matcher) =>
    elements.filter((element) => matcher(element.componentRole)).map((element) => element.id);
  const formChildren = byRole((role) => /form-field/.test(role));
  const actionChildren = byRole((role) => /primary-action/.test(role));
  const sectionChildren = byRole((role) => /content-section|text-block/.test(role));

  return {
    textLines: elements.length,
    appShells: sectionChildren.length
      ? [{ id: "svg-content-regions", children: sectionChildren, confidence: 0.78 }]
      : [],
    repeatedLists: [],
    repeatedGrids: [],
    statRows: [],
    formGroups: formChildren.length
      ? [{ id: "svg-form-fields", children: formChildren, confidence: 0.82 }]
      : [],
    dataTables: [],
    charts: [],
    actionClusters: actionChildren.length
      ? [{ id: "svg-actions", children: actionChildren, confidence: 0.82 }]
      : [],
    tabSets: [],
    dialogPanels: [],
    emptyStates: [],
  };
}

function buildGeneratedSvgResponsiveBlueprint(svgInspection) {
  const width = svgInspection.source.width ?? 0;
  const height = svgInspection.source.height ?? 0;
  const portrait = width > 0 && height > 0 && width < height;

  return {
    mode: portrait ? "svg-mobile-stack" : "svg-responsive-grid",
    breakpoints: portrait ? ["base", "sm"] : ["base", "md", "lg"],
    primaryFlow: "Review SVG labels as semantic regions, then replace placeholder controls with product data.",
  };
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

const designTokens = ${JSON.stringify(tokens, null, 2)};

const detectedElements = ${JSON.stringify(detectedElements, null, 2)};

const detectedPatterns = ${JSON.stringify(detectedPatterns, null, 2)};

const responsiveIntent = ${JSON.stringify(responsiveIntent, null, 2)};

const screenIntent = ${JSON.stringify(screenIntent, null, 2)};

const layoutRegions = ${JSON.stringify(regions, null, 2)};

const sampleData = {
  screenTitle: "${archetype.label} workspace",
  screenDescription:
    "Use this generated starter as a production-facing layout, then replace sample copy and values with product data.",
  primaryAction: "Review export",
  secondaryAction: "Open design notes",
};

const sampleCollections = {
  rows: [
    { title: "Queued review", detail: "Replace with a real list item" },
    { title: "Ready for handoff", detail: "Connect this row to product data" },
    { title: "Needs QA", detail: "Use loading, empty, and error states here" },
  ],
  cards: [
    { title: "Overview", detail: "Card content placeholder" },
    { title: "Activity", detail: "Swap for real entity data" },
    { title: "Follow-up", detail: "Support unavailable-item fallbacks" },
    { title: "Review", detail: "Keep hierarchy from the screenshot" },
  ],
  metrics: [
    { label: "Revenue", value: "$45.2K", trend: "+12% vs last period" },
    { label: "Users", value: "12,340", trend: "+8% active" },
    { label: "Conversion", value: "18.4%", trend: "-2% needs review" },
    { label: "Tickets", value: "573", trend: "24 open" },
  ],
  tableRows: [
    ["Acme Co", "Active", "$12.4K"],
    ["Northstar", "Review", "$8.1K"],
    ["Summit Labs", "Paused", "$4.8K"],
  ],
  chartValues: [42, 74, 55, 88, 63, 78, 48, 92],
};

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
  "chart-series": "Chart card with accessible text summary",
  "list-item": "Card row",
  "list-row": "Card row",
  "data-table": "semantic table inside Card",
  "tab-set": "Tabs",
  "dialog-panel": "Dialog-ready Card surface",
  "empty-state": "Card with centered recovery action",
};

const generatedLayoutGrid = {
  rows: ${gridRows},
  columns: ${gridColumns},
};

type DetectionElement = {
  id: string;
  kind?: string;
  primitive?: string;
  componentRole?: string;
  label?: string;
  confidence?: number;
  patternConfidence?: number;
  reasons?: string[];
  itemCount?: number;
  rows?: number;
  columns?: number;
  fieldCount?: number;
  cardCount?: number;
  seriesCount?: number;
  tabCount?: number;
  selectedIndex?: number;
  clusterType?: string;
  modalType?: string;
  tabKind?: string;
};

type LayoutRegion = DetectionElement & {
  title?: string;
  guidance?: string;
  meta?: string;
  role?: AriaRole;
  tone?: keyof typeof designTokens;
  gridColumn?: string;
  gridRow?: string;
};

type UsableSectionModel = LayoutRegion & {
  primitive: string;
  title: string;
  guidance: string;
  layoutClass: string;
  items: Array<DetectionElement | LayoutRegion>;
};

export default function ${componentName}() {
  const sections = buildUsableSections(layoutRegions, detectedElements);

  return (
    <main
      aria-label="${archetype.label} export from ${safeName}"
      className="min-h-dvh bg-background text-foreground"
    >
      <section className="mx-auto grid w-full max-w-6xl gap-6 p-4 sm:p-6 lg:p-8">
        <GeneratedScreenHeader />

        <ImplementationChecklist />

        <div className="grid gap-4 lg:grid-cols-2">
          {sections.map((section) => (
            <UsableSection key={section.id} section={section} />
          ))}
        </div>
      </section>
    </main>
  );
}

function GeneratedScreenHeader() {
  return (
    <header className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{screenIntent.label}</Badge>
          <Badge variant="outline">{responsiveIntent.mode}</Badge>
        </div>
        <div className="grid gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{sampleData.screenTitle}</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {sampleData.screenDescription}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        <Button type="button">{sampleData.primaryAction}</Button>
        <Button type="button" variant="outline">
          {sampleData.secondaryAction}
        </Button>
      </div>
    </header>
  );
}

function ImplementationChecklist() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Implementation checklist</CardTitle>
        <CardDescription>
          {detectedElements.length} elements and {layoutRegions.length} regions were converted into a
          {generatedLayoutGrid.columns}-column starter layout for implementation review.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
        <p>
          <span className="block font-medium text-foreground">Screen intent</span>
          {screenIntent.label} ({Math.round(screenIntent.confidence * 100)}%)
        </p>
        <p>
          <span className="block font-medium text-foreground">Responsive intent</span>
          {responsiveIntent.mode} - {responsiveIntent.breakpoints.join(" / ")}
        </p>
        <p>
          <span className="block font-medium text-foreground">Grouped patterns</span>
          {detectedPatterns.appShells.length} shells, {detectedPatterns.formGroups.length} forms,{" "}
          {detectedPatterns.dataTables.length} tables
        </p>
      </CardContent>
    </Card>
  );
}

function UsableSection({ section }: { section: UsableSectionModel }) {
  if (section.primitive === "tab-set") {
    return <TabSection section={section} />;
  }

  if (section.primitive === "form-group") {
    return <FormSection section={section} />;
  }

  return <GenericSection section={section} />;
}

function TabSection({ section }: { section: UsableSectionModel }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{section.title}</CardTitle>
        <CardDescription>{section.guidance}</CardDescription>
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
              <PrimitiveBlock item={item} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function FormSection({ section }: { section: UsableSectionModel }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{section.title}</CardTitle>
        <CardDescription>{section.guidance}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4">
          {section.items.length ? (
            section.items.map((item, index) =>
              /action|button/.test(item.componentRole ?? "") ? (
                <Button key={item.id} type="button" className="w-fit">
                  {item.label}
                </Button>
              ) : (
                <div key={item.id} className="grid gap-2">
                  <Label htmlFor={item.id}>Field {index + 1}</Label>
                  <Input id={item.id} placeholder="Enter product data" />
                </div>
              ),
            )
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="generated-primary-field">Primary field</Label>
                <Input id="generated-primary-field" placeholder="Enter product data" />
              </div>
              <Button type="button" className="w-fit">Submit action</Button>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function GenericSection({ section }: { section: UsableSectionModel }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription>{section.guidance}</CardDescription>
          </div>
          <Badge variant="outline">{section.primitive}</Badge>
        </div>
      </CardHeader>
      <CardContent className={section.layoutClass}>
        {(section.items.length ? section.items : [section]).map((item) => (
          <PrimitiveBlock key={item.id} item={item} />
        ))}
      </CardContent>
    </Card>
  );
}

function PrimitiveBlock({ item }: { item: DetectionElement | LayoutRegion }) {
  const role = item.componentRole || item.primitive || item.kind || "section";
  const label = item.label || formatPrimitiveLabel(role);
  const confidence = Math.round((item.confidence ?? item.patternConfidence ?? 0.55) * 100);

  if (/primary-action|icon-action/.test(role)) {
    return <Button type="button">{label}</Button>;
  }

  if (/search-field|form-field/.test(role)) {
    return (
      <div className="grid gap-2">
        <Label htmlFor={item.id}>{label}</Label>
        <Input id={item.id} placeholder="Enter product data" />
      </div>
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
      <PrimitiveBody item={item} />
    </article>
  );
}

function PrimitiveBody({ item }: { item: DetectionElement | LayoutRegion }) {
  return renderPrimitiveBody(item, designTokens);
}

function buildUsableSections(
  regions: LayoutRegion[],
  elements: DetectionElement[],
): UsableSectionModel[] {
  const elementSections = regions.length
    ? regions
    : elements.map((element) => ({
        ...element,
        label: formatPrimitiveLabel(element.componentRole || element.primitive || element.kind),
        guidance: "Detected primitive converted into a reusable component block.",
      }));

  return elementSections.map((region, index) => {
    const primitive = region.componentRole || region.primitive || region.kind || "section";
    return {
      ...region,
      id: region.id || "section-" + (index + 1),
      primitive,
      title: region.label || formatPrimitiveLabel(primitive),
      guidance: region.guidance || "Connect this generated region to real data and copy.",
      layoutClass: /grid|stat-row|repeated-grid/.test(primitive)
        ? "grid gap-3 sm:grid-cols-2"
        : /action-cluster/.test(primitive)
          ? "flex flex-wrap gap-2"
          : "grid gap-3",
      items: elements
        .filter((element) => element.componentRole === primitive || element.primitive === primitive)
        .slice(0, 6)
        .map((element) => ({
          ...element,
          label: formatPrimitiveLabel(element.componentRole || element.primitive || element.kind),
        })),
    };
  });
}

export function DetectionGridReference() {
  return (
    <section
      aria-label="${archetype.label} export based on ${safeName}"
      className="space-y-4"
      style={{ backgroundColor: designTokens.surface, color: designTokens.foreground }}
    >
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase">Screenshot export</p>
        <h1 className="text-xl font-semibold">${archetype.label}</h1>
        <p className="text-sm opacity-75">
          {detectedElements.length} UI elements were detected before component generation.
          {" "}
          {detectedPatterns.appShells.length} app shell patterns, {detectedPatterns.dialogPanels.length} dialog panels, {detectedPatterns.emptyStates.length} empty states, {detectedPatterns.repeatedLists.length} repeated list patterns, {detectedPatterns.repeatedGrids.length} repeated grid patterns, {detectedPatterns.statRows.length} stat rows, {detectedPatterns.formGroups.length} form groups, {detectedPatterns.dataTables.length} data tables, {detectedPatterns.charts.length} chart series, {detectedPatterns.actionClusters.length} action clusters, {detectedPatterns.tabSets.length} tab sets, and {detectedPatterns.textLines} text-line signals shape the export.
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
                  <nav
                    className="flex flex-wrap items-center gap-2 rounded border px-3 py-2"
                    aria-label="Top navigation"
                    style={{ borderColor: designTokens.border, backgroundColor: designTokens.surface }}
                  >
                    {["Overview", "Reports", "Settings"].map((item, index) => (
                      <Button
                        key={item}
                        type="button"
                        variant={index === 0 ? "secondary" : "ghost"}
                        className="h-7 rounded-full px-2.5 text-[11px]"
                        aria-current={index === 0 ? "page" : undefined}
                      >
                        {item}
                      </Button>
                    ))}
                  </nav>
                ) : null}
                <main className="grid min-h-24 gap-2 md:grid-cols-[8rem_minmax(0,1fr)]">
                  {shell.regions.sideNavigation ? (
                    <nav
                      className="grid content-start gap-1 rounded border px-2 py-2"
                      aria-label="Side navigation"
                      style={{ borderColor: designTokens.border, backgroundColor: designTokens.surface }}
                    >
                      {["Home", "Team", "Billing"].map((item, index) => (
                        <Button
                          key={item}
                          type="button"
                          variant={index === 0 ? "secondary" : "ghost"}
                          className="h-8 justify-start rounded px-2 text-[11px]"
                          aria-current={index === 0 ? "page" : undefined}
                        >
                          {item}
                        </Button>
                      ))}
                    </nav>
                  ) : null}
                  <section className="rounded border px-3 py-2" style={{ borderColor: designTokens.border }}>
                    Page content region
                  </section>
                </main>
                {shell.regions.bottomNavigation ? (
                  <nav
                    className="grid grid-cols-3 gap-1 rounded border px-2 py-2"
                    aria-label="Bottom navigation"
                    style={{ borderColor: designTokens.border, backgroundColor: designTokens.surface }}
                  >
                    {["Home", "Search", "Profile"].map((item, index) => (
                      <Button
                        key={item}
                        type="button"
                        variant={index === 0 ? "secondary" : "ghost"}
                        className="h-8 rounded px-2 text-[11px]"
                        aria-current={index === 0 ? "page" : undefined}
                      >
                        {item}
                      </Button>
                    ))}
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
            role={region.role ?? "region"}
            className="border text-sm shadow-sm"
            style={{
              backgroundColor:
                region.tone === "accent" ? designTokens.accent : designTokens[region.tone ?? "surface"],
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

function renderPrimitiveBody(region: LayoutRegion | DetectionElement, tokens: typeof designTokens) {
  const primitive = region.primitive || region.kind || "section";
  const componentRole = region.componentRole || primitive;
  const label = formatPrimitiveLabel(primitive);
  const roleLabel = formatPrimitiveLabel(componentRole);

  if (region.kind === "dialog-panel" || primitive === "dialog-panel") {
    return (
      <Dialog defaultOpen>
        <DialogContent className="max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{formatPrimitiveLabel(region.modalType || "dialog")}</DialogTitle>
            <DialogDescription>
              Floating modal surface with grouped content and focus management.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <span className="h-2 w-10/12 rounded-full" style={{ backgroundColor: tokens.border }} />
            <span className="h-2 w-7/12 rounded-full" style={{ backgroundColor: tokens.border }} />
          </div>
          <DialogFooter>
            <Button type="button">Primary action</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (region.kind === "empty-state" || primitive === "empty-state") {
    return (
      <div
        className="mt-3 grid min-h-40 place-items-center rounded border p-4 text-center"
        role="status"
        style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}
      >
        <div className="grid max-w-xs gap-2">
          <p className="text-sm font-semibold">No results yet</p>
          <p className="text-[11px] opacity-70">
            Empty state with short explanation and one recovery action.
          </p>
          <Button
            type="button"
            className="mx-auto mt-1 w-fit rounded px-3 py-2 text-xs font-medium"
            style={{ backgroundColor: tokens.accent, color: tokens.accentForeground }}
          >
            Add item
          </Button>
        </div>
      </div>
    );
  }

  if (region.kind === "repeated-list" || primitive === "list-item") {
    const rows = Array.from({ length: Math.max(1, region.itemCount ?? 3) }).map(
      (_, index) =>
        sampleCollections.rows[index] ?? {
          title: "Row " + (index + 1),
          detail: "Replace with a real list item",
        },
    );
    return (
      <div className="mt-3 grid gap-2">
        <ul className="space-y-2" aria-label={region.label}>
          {rows.map((item, itemIndex) => (
            <li
              key={item.title}
              className="rounded border px-2 py-1 text-xs"
              style={{ borderColor: tokens.border, backgroundColor: tokens.muted }}
            >
              <span className="font-medium">{item.title}</span>
              <span className="block opacity-70">{item.detail}</span>
            </li>
          ))}
        </ul>
        <p className="text-[11px] opacity-70">
          State coverage: add loading skeletons, empty copy, and row-level error handling before wiring real data.
        </p>
      </div>
    );
  }

  if (region.kind === "repeated-grid" || primitive === "card-grid") {
    const cards = Array.from({ length: Math.max(1, region.itemCount ?? 4) }).map(
      (_, index) =>
        sampleCollections.cards[index] ?? {
          title: "Card " + (index + 1),
          detail: "Swap for real entity data",
        },
    );
    return (
      <div className="mt-3 grid gap-2">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: "repeat(" + Math.max(1, region.columns ?? 2) + ", minmax(0, 1fr))",
          }}
          aria-label={region.label}
        >
          {cards.map((item) => (
            <article
              key={item.title}
              className="rounded border p-2 text-xs"
              style={{ borderColor: tokens.border, backgroundColor: tokens.muted }}
            >
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 opacity-70">{item.detail}</p>
              <span className="mt-2 block h-2 w-8/12 rounded-full" style={{ backgroundColor: tokens.border }} />
            </article>
          ))}
        </div>
        <p className="text-[11px] opacity-70">
          State coverage: include loading cards, empty grid messaging, and unavailable-item fallbacks.
        </p>
      </div>
    );
  }

  if (region.kind === "stat-row" || primitive === "stat-row") {
    const cards = Math.max(2, region.cardCount ?? region.itemCount ?? 3);
    const metrics = Array.from({ length: cards }).map(
      (_, index) =>
        sampleCollections.metrics[index] ?? {
          label: "Metric " + (index + 1),
          value: "0",
          trend: "Connect to product data",
        },
    );
    return (
      <div
        className="mt-3 grid gap-2"
        style={{
          gridTemplateColumns: "repeat(" + cards + ", minmax(0, 1fr))",
        }}
        aria-label={region.label + " KPI cards"}
      >
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded border p-3 text-xs"
            style={{ borderColor: tokens.border, backgroundColor: tokens.muted }}
          >
            <p className="text-[11px] uppercase opacity-70">{metric.label}</p>
            <p className="mt-1 text-xl font-semibold">{metric.value}</p>
            <p className="mt-1 text-[11px] opacity-70">{metric.trend}</p>
          </article>
        ))}
      </div>
    );
  }

  if (region.kind === "form-group" || primitive === "form-group") {
    return (
      <form className="mt-3 grid gap-2" aria-label={region.label}>
        {Array.from({ length: Math.max(1, region.fieldCount ?? 2) }).map((_, itemIndex) => (
          <div key={itemIndex} className="grid gap-1.5">
            <Label htmlFor={region.id + "-field-" + (itemIndex + 1)}>
              Field {itemIndex + 1}
            </Label>
            <Input
              id={region.id + "-field-" + (itemIndex + 1)}
              placeholder="Value or input"
              style={{ backgroundColor: tokens.surface }}
            />
          </div>
        ))}
        <Button
          type="button"
          className="mt-1 w-fit rounded px-3 py-2 text-xs font-medium"
          style={{ backgroundColor: tokens.accent, color: tokens.accentForeground }}
        >
          Submit action
        </Button>
        <p className="text-[11px] opacity-70">
          State coverage: wire validation errors, pending submit state, and success feedback.
        </p>
      </form>
    );
  }

  if (region.kind === "data-table" || primitive === "data-table") {
    const rows = Math.max(2, region.rows ?? 3);
    const columns = Math.max(2, region.columns ?? 3);
    const tableRows = Array.from({ length: rows }).map(
      (_, index) => sampleCollections.tableRows[index] ?? [],
    );
    return (
      <div className="mt-3 grid gap-2 overflow-x-auto">
        <Table className="min-w-[28rem] text-xs" aria-label={region.label}>
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <TableHead key={columnIndex}>Column {columnIndex + 1}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows.map((row, rowIndex) => (
              <TableRow key={row.join("-")}>
                {Array.from({ length: columns }).map((_, columnIndex) => (
                  <TableCell key={columnIndex}>
                    {row[columnIndex] ?? "Cell " + (rowIndex + 1) + "." + (columnIndex + 1)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-[11px] opacity-70">
          State coverage: add loading rows, no-results messaging, pagination overflow, and fetch-error recovery.
        </p>
      </div>
    );
  }

  if (region.kind === "chart-series" || primitive === "chart-series") {
    const bars = Math.max(3, region.seriesCount ?? region.itemCount ?? 5);
    return (
      <div className="mt-3 grid gap-2">
        <div
          className="grid min-h-32 items-end gap-2 rounded border p-3"
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
                height: sampleCollections.chartValues[index % sampleCollections.chartValues.length] + "%",
                backgroundColor: tokens.accent,
              }}
            />
          ))}
        </div>
        <p className="text-[11px] opacity-70">
          State coverage: include loading, no-data, and metric fetch-error summaries for screen readers.
        </p>
      </div>
    );
  }

  if (region.kind === "tab-set" || primitive === "tab-set") {
    const tabs = Math.max(2, region.tabCount ?? region.itemCount ?? 3);
    const selectedIndex = Math.min(tabs - 1, Math.max(0, region.selectedIndex ?? 0));
    return (
      <Tabs defaultValue={"tab-" + (selectedIndex + 1)} className="mt-3">
        <TabsList aria-label={region.label}>
          {Array.from({ length: tabs }).map((_, index) => (
            <TabsTrigger key={index} value={"tab-" + (index + 1)}>
              Tab {index + 1}
            </TabsTrigger>
          ))}
        </TabsList>
        {Array.from({ length: tabs }).map((_, index) => (
          <TabsContent
            key={index}
            value={"tab-" + (index + 1)}
            className="rounded border p-3 text-xs"
            style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}
          >
            {formatPrimitiveLabel(region.tabKind || "tabs")} panel {index + 1}
          </TabsContent>
        ))}
      </Tabs>
    );
  }

  if (region.kind === "action-cluster" || primitive === "action-cluster") {
    const controls = Math.max(2, region.controlCount ?? region.itemCount ?? 3);
    const clusterType = region.clusterType || "toolbar";
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2" aria-label={region.label + " controls"}>
        {Array.from({ length: controls }).map((_, index) => (
          <Button
            key={index}
            type="button"
            variant={index === 0 ? "default" : "outline"}
            className={clusterType === "segmented-control" ? "rounded-full border px-3 py-1.5 text-xs" : "rounded px-3 py-2 text-xs font-medium"}
            style={{
              borderColor: tokens.border,
              backgroundColor: index === 0 ? tokens.accent : tokens.surface,
              color: index === 0 ? tokens.accentForeground : tokens.foreground,
            }}
          >
            Action {index + 1}
          </Button>
        ))}
      </div>
    );
  }

  if (/header|nav/.test(primitive)) {
    return (
      <nav className="mt-3 flex flex-wrap items-center gap-2" aria-label={region.label + " navigation"}>
        {["Overview", "Workflows", "Settings"].map((item, index) => (
          <Button
            key={item}
            type="button"
            variant={index === 0 ? "secondary" : "ghost"}
            className="rounded-full px-2.5 py-1 text-[11px]"
            aria-current={index === 0 ? "page" : undefined}
            style={{
              borderColor: tokens.border,
              backgroundColor: index === 0 ? tokens.muted : tokens.surface,
              color: tokens.foreground,
            }}
          >
            {item}
          </Button>
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
        <Button type="button" className="mt-3 w-fit rounded px-3 py-2 text-xs font-medium" style={{ backgroundColor: tokens.accent, color: tokens.accentForeground }}>
          {roleLabel}
        </Button>
      );
    }

    return (
      <div className="mt-3 grid gap-2" aria-label={label + " primitive preview"}>
        <Label htmlFor={region.id + "-control"}>{roleLabel}</Label>
        <div className="flex items-center gap-2">
          <Input id={region.id + "-control"} placeholder="User input or action" />
          <Button type="button" size="xs" className="rounded px-2 py-1 text-[11px]" style={{ backgroundColor: tokens.accent, color: tokens.accentForeground }}>
            Apply
          </Button>
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
        <p className="mt-1 text-[11px] opacity-70">Card surface with grouped title, content, and supporting metadata.</p>
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
      <div className="mt-3 space-y-1.5" aria-label={label + " text preview"}>
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

function formatPrimitiveLabel(value: string | undefined) {
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
      ...(region.textCount ? { textCount: region.textCount } : {}),
      ...(region.supportCount ? { supportCount: region.supportCount } : {}),
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
    emptyStates: (patterns.emptyStates ?? []).slice(0, 4).map((pattern, index) => ({
      id: pattern.id ?? `empty-state-${index + 1}`,
      axis: pattern.axis ?? "centered",
      confidence: pattern.confidence ?? 0.5,
      textCount: pattern.textCount ?? 0,
      actionCount: pattern.actionCount ?? 0,
      supportCount: pattern.supportCount ?? 0,
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
      patternRoles: element.signals?.patternRoles,
      patternConfidence: element.signals?.patternConfidence,
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
  const emptyStates = inspection.layoutTree?.patterns?.emptyStates ?? [];
  if (
    !repeatedLists.length &&
    !repeatedGrids.length &&
    !statRows.length &&
    !formGroups.length &&
    !dataTables.length &&
    !charts.length &&
    !actionClusters.length &&
    !tabSets.length &&
    !dialogPanels.length &&
    !emptyStates.length
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
  const emptyStateRegions = emptyStates.slice(0, 4).map((pattern) => {
    const region = sourceBoxToGridRegion(pattern.box, inspection);
    return {
      ...region,
      kind: "empty-state",
      primitive: "empty-state",
      componentRole: "empty-state",
      textCount: pattern.textCount ?? 0,
      actionCount: pattern.actionCount ?? 0,
      itemCount: pattern.children?.length ?? 0,
      centeredness: pattern.centeredness ?? null,
      patternConfidence: pattern.confidence,
    };
  });

  return [
    ...dialogRegions,
    ...emptyStateRegions,
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
        `${fileName} is treated as the source screenshot (${context.readableSize}, ${file.type || "unknown type"}).`,
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
    generatedCode: normalizeGeneratedShadcnImports(
      buildGeneratedCode(fileName, archetype, file.offlineInspection, svgInspection),
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
