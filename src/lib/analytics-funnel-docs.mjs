/** Static funnel metric definitions (docs-only / dashboard legend). */

export const ANALYTICS_FUNNEL_SLICES = [
  {
    id: "upload-funnel",
    title: "Upload funnel health",
    events: [
      "upload.selected",
      "analysis.started",
      "analysis.completed",
      "generate.completed",
    ],
    breakdown: ["route", "providerState", "status"],
    purpose: "Detect drop-offs from upload through generated preview.",
  },
  {
    id: "reliability",
    title: "Fallback and reliability",
    events: ["analysis.failed", "analysis.completed"],
    breakdown: ["status", "providerState"],
    purpose: "Monitor fallback rate and instant-demo usage.",
  },
  {
    id: "export-intent",
    title: "Export intent vs success",
    events: ["export.triggered"],
    breakdown: ["trigger", "feature", "status", "source"],
    purpose: "Compare copy vs export behavior and failure rates.",
  },
  {
    id: "design-system",
    title: "Design system discovery",
    events: [
      "design_system.viewed",
      "design_system.search_updated",
      "design_system.domain_changed",
      "design_system.level_changed",
      "design_system.variant_changed",
    ],
    breakdown: ["domain", "level", "entryId", "queryLength", "totalVisible"],
    purpose: "Understand catalog navigation and search friction.",
  },
  {
    id: "home-hero",
    title: "Home hero",
    events: ["home.hero_viewed", "home.hero_cta_clicked"],
    breakdown: ["feature", "route"],
    purpose: "Measure marketing hero views and CTA clicks.",
  },
  {
    id: "route-coverage",
    title: "Route coverage sanity",
    events: ["*"],
    breakdown: ["route"],
    purpose: "Ensure only expected paths appear; no query-string leakage.",
  },
];

export const ANALYTICS_ACTIVATION_FLAGS = [
  "NEXT_PUBLIC_OBSERVABILITY_ENABLED=true",
  "NEXT_PUBLIC_ANALYTICS_ENABLED=true",
];
