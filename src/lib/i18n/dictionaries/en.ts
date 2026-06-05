export const en = {
  hero: {
    badgeDemo: "Qwen meetup demo",
    badgeOffline: "Offline-safe · instant preview",
    title: "Turn UI screenshots into scaffold-ready React",
    subtitle:
      "Turn UI screenshots into React + Tailwind scaffolds with Qwen3-VL and Qwen Code. Upload, analyze, and export in minutes—built for live presentations without touching production APIs.",
    ctaPrimary: "Try the live flow",
    ctaSecondary: "Explore design system",
    oneClickDemo: "One-click demo",
    trustDemo: "Demo mode — no API key",
    trustOffline: "Runs offline for meetups",
    benefitUploadTitle: "Start from any screenshot",
    benefitUploadBody:
      "Drop PNG, JPG, SVG, or WebP—or load the built-in sample in one click.",
    benefitAnalyzeTitle: "See structure before you code",
    benefitAnalyzeBody:
      "Get layout analysis, plan cards, and a React + Tailwind scaffold you can refine.",
    benefitDesignTitle: "Polish with the design system",
    benefitDesignBody:
      "Browse atomic snippets and UX-law patterns to speed up the last mile.",
    trustSignalsAria: "Trust signals",
    keyBenefitsAria: "Key benefits",
  },
  header: {
    siteTitle: "qwen-ui-lab",
    siteTagline: "Screenshot → scaffold demo",
    navMainAria: "Main",
    navDashboard: "Dashboard",
    navDashboardAria: "Dashboard",
    navDesignSystem: "Design system",
    navDesignSystemAria: "Design system",
    labsBadge: "Labs",
  },
  demoBanner: {
    title: "Demo mode — safe for live demos",
    body: "Analyze and previews run locally with no API key. Turn on live Qwen only in deploy settings when you are ready to spend credits.",
    dismissTitle: "Dismiss",
    dismissAria: "Dismiss demo mode notice",
  },
  designSystem: {
    eyebrow: "Design system",
    title: "Atomic component lab",
    subtitle:
      "Filter by tier and domain, preview variants, and copy export-ready snippets for your next sprint.",
    searchLabel: "Search catalog",
    searchPlaceholder: "Search components…",
    domain: "Domain",
    tier: "Tier",
    tierAll: "all",
    domainAll: "All",
    domainProduct: "Product",
    domainUiLaws: "UILaws",
    domainLawsOfUx: "Laws of UX",
    keyboardHelp:
      "Press / to search, j and k to move through the list. Alt+1–4 changes domain; Alt+Shift+0–3 changes tier.",
    visibleCount: "{count} visible",
    refs: "Refs:",
    componentList: "Component list",
    denseView: "Dense view",
    tierSrOnly: "Tier",
    domainSrOnly: "Domain",
    noResults: "No components match your search.",
    previewToolbarAria: "Preview panel actions",
    backToDashboard: "← Back to dashboard demo",
    exportAll: "Export all snippets",
    tryWorkflow: "Try screenshot-to-scaffold workflow →",
    pickComponent: "Pick a component from the list to inspect preview, props, and snippet.",
    bundleDownloaded: "Design system bundle downloaded",
    renderError: "Could not render {name}.",
  },
  uploadFlow: {
    sharedSummaryTitle: "Shared analysis summary",
    sharedSummaryDescription: "Read-only link — no code or secrets included ({file})",
    ctaAnalyzing: "Analyzing…",
    analyzeStepReading: "Reading image…",
    analyzeStepPreprocessing: "Preprocessing image…",
    analyzeStepChecking: "Checking provider…",
    analyzeStepLayout: "Analyzing layout…",
    analyzeStepBuilding: "Building artifact…",
    progressCheckingProvider: "Checking provider…",
    progressBuildingOffline: "Building offline demo…",
    progressCallingApi: "Calling Qwen vision API…",
    progressRetrying: "Retrying after transient error…",
    progressComplete: "Analysis complete",
    stepUpload: "Upload",
    stepAnalyze: "Analyze",
    stepPlan: "Plan",
    stepGenerate: "Generate",
    stepPreview: "Preview",
    stepExport: "Export",
    alertOfflineTitle: "Offline demo mode",
    alertOfflineBody:
      "The full Upload → Analyze → Preview flow still runs locally for your presentation.",
    alertOfflineReason: "Reason: {detail}",
    liveFlowLabel: "Live flow",
    headlineDefault: "Upload screenshot to component preview",
    headlineFaster: "Ship scaffold-ready UI from one screenshot",
    subtitleDefault:
      "Ideal for rapid design reviews: analyze one screenshot, generate a scaffold, then reuse exported snippets across your next sprint.",
    subtitleFaster:
      "A faster path to conversion: upload, analyze, and export reusable React/Tailwind scaffolds in minutes.",
    modeLocalDemo: "Local demo mode",
    modeQwenReady: "Qwen route ready",
    recentAnalyses: "Recent analyses",
    recentAnalysesStored: "Stored locally (last {count})",
    removeSessionAria: "Remove {fileName} session",
    uploadedReference: "Uploaded reference",
    uploadedReferenceAlt: "Uploaded UI reference",
    uploadedReferenceAltNamed: "Uploaded UI reference: {fileName}",
    referenceImage: "Reference image",
    fileUnknownType: "unknown type",
    fileReady: "ready",
    errorInvalidImage: "Upload an image file: PNG, JPG, SVG, or WebP.",
    errorNoImage: "Choose an image before running analysis.",
    errorSampleLoad:
      "Could not load the sample screenshot. Upload your own image instead.",
    tryBundledReference: "Try a bundled reference",
    loadSampleAria: "Load {label} sample",
    loading: "Loading…",
    samplePathHint: "New here? Pick a reference, then run analysis.",
    samples: {
      dashboard: { label: "Dashboard", hint: "PNG screenshot · Admin analytics shell" },
      auth: { label: "Sign in", hint: "PNG screenshot · Centered auth card" },
      mobile: { label: "Mobile app", hint: "PNG screenshot · Phone shell + bottom nav" },
      landing: { label: "Landing page", hint: "Marketing hero + pricing" },
      settings: { label: "Settings", hint: "Profile + toggles" },
      ecommerce: { label: "Shop catalog", hint: "Filters + product grid" },
    },
    ctaRegenerate: "Regenerate preview",
    ctaGenerate: "Generate preview",
    ctaAnalyzeNow: "Analyze & generate now",
    ctaAnalyzePreview: "Analyze & generate preview",
    progressLabel: "{step} ({percent}%)",
    statusQwenComplete:
      "Qwen analysis complete — open the preview to see the scaffold.",
    statusDemoComplete:
      "Demo analysis complete — open the preview to see the scaffold.",
    statusPreviewReady:
      "Preview ready — copy or export the scaffold from the panel on the right.",
    analysisOutputLabel: "Analysis output (reference on the left)",
    copyShareLink: "Copy share link",
    copying: "Copying…",
    toastShareCopied: "Share link copied (read-only summary)",
    toastShareFailed: "Could not copy share link",
    defaultScreenshotName: "screenshot",
    exportScaffold: "Export scaffold",
    exportScaffoldDesc: "Copy or download the generated React + Tailwind code.",
    exportCopyAll: "Copy all",
    exportDownload: "Download .tsx",
    toastScaffoldCopied: "Scaffold copied",
    toastScaffoldExported: "Scaffold exported",
    exportGenerateHint: "Generate preview to see live stats alongside the snippet.",
    generatedScaffold: "Generated scaffold",
    livePreview: "Live preview",
    emptyState: "Upload a screenshot and run analysis to see the generated plan.",
    toastInstantDemo: "Instant offline demo analysis ready",
    toastQwenComplete: "Qwen analysis complete",
    toastFallback: "Fell back to offline demo analysis",
    toastAnalyzeFailed: "Analysis failed — using local fallback",
    toastPreviewGenerated: "Preview generated",
    toastPreviewRegenerated: "Preview regenerated",
    toastRestoredQwen: "Restored Qwen analysis session",
    toastRestoredDemo: "Restored offline demo session",
    toastRestoredSession: "Restored session: {fileName}",
    toastSessionRemoved: "Session removed",
    toastSampleLoaded: "{label} sample loaded",
    toastSampleLoadFailed: "Could not load sample screenshot",
  },
} as const;

export type HeroDictionary = {
  [K in keyof (typeof en)["hero"]]: string;
};

export type UploadFlowDictionary = {
  [K in keyof (typeof en)["uploadFlow"]]: (typeof en)["uploadFlow"][K] extends string
    ? string
    : {
        [SK in keyof (typeof en)["uploadFlow"]["samples"]]: {
          label: string;
          hint: string;
        };
      };
};

export type HeaderDictionary = {
  [K in keyof (typeof en)["header"]]: string;
};

export type DemoBannerDictionary = {
  [K in keyof (typeof en)["demoBanner"]]: string;
};

export type DesignSystemDictionary = {
  [K in keyof (typeof en)["designSystem"]]: string;
};

export type Dictionary = {
  hero: HeroDictionary;
  header: HeaderDictionary;
  demoBanner: DemoBannerDictionary;
  designSystem: DesignSystemDictionary;
  uploadFlow: UploadFlowDictionary;
};
