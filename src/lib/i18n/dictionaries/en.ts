export const en = {
  hero: {
    badgeDemo: "Meetup-ready",
    badgeOffline: "Local-first preview",
    title: "Scaffold UI in minutes",
    subtitle:
      "Upload one screenshot; get a layout plan, editable preview, and export-ready React + Tailwind.",
    ctaPrimary: "Start workflow",
    ctaSecondary: "Browse components",
    oneClickDemo: "Load sample",
    trustDemo: "No API key needed",
    trustOffline: "Runs locally",
    benefitUploadLabel: "Plan",
    benefitUploadTitle: "Map the layout",
    benefitUploadBody:
      "Find sections, cards, controls, and repeated groups before generation.",
    benefitAnalyzeLabel: "Preview",
    benefitAnalyzeTitle: "Inspect the scaffold",
    benefitAnalyzeBody:
      "Review the generated React + Tailwind component before exporting it.",
    benefitDesignLabel: "Export",
    benefitDesignTitle: "Ship the handoff",
    benefitDesignBody:
      "Copy TSX, Design.md, and handoff bundles from the generated result.",
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
    navAccountGuest: "Guest",
    navAccountAria: "Account",
    labsBadge: "Labs",
  },
  notFound: {
    title: "Page not found",
    description:
      "The page you requested doesn't exist or may have been moved. Choose a destination below to continue exploring qwen-ui-lab.",
    navAria: "Back to known pages",
    backDashboard: "Back to dashboard",
    designSystem: "Design system",
  },
  share: {
    eyebrow: "Share link",
    title: "Read-only analysis summary",
    descriptionLead: "Short link",
    descriptionTrail: "— summary only, no generated code or API secrets.",
    tryLiveDemo: "Try the live demo",
    oneClickDemo: "One-click demo",
    metadataNotFoundTitle: "Share not found",
    metadataNotFoundDescription:
      "This read-only analysis summary link is missing or expired.",
    metadataTitle: "Shared summary · {file}",
    notFoundTitle: "Share link unavailable",
    notFoundDescription:
      "This read-only analysis summary was not found. The link may have expired, been created on another server instance, or been cleared during a deploy.",
    notFoundStorageHint:
      "Production short links need KV storage. Without KV, links use temporary memory storage and may not survive cold starts.",
  },
  account: {
    eyebrow: "Profile",
    title: "Profile",
    subtitle:
      "Set the name shown in the header and recent analyses.",
    statusTitle: "Session",
    statusDesc: "Used by the header and recent analysis list.",
    localFactsTitle: "What stays local",
    currentLabelTitle: "Shown as",
    storedInTitle: "Saved in",
    storedInBody: "This browser tab only",
    notAccountTitle: "No account created",
    notAccountBody: "No password, OAuth, server account, or outbound email.",
    modeGuest: "Guest session",
    modeNamed: "Local profile",
    savedScaffoldsAs: "Saved analyses show as “{name}”",
    displayNameTitle: "Display name",
    displayNameDesc:
      "Leave blank to use Guest.",
    displayNameLabel: "Name",
    displayNamePlaceholder: "e.g. Alex",
    saveDisplayName: "Save changes",
    signOut: "Clear profile",
    backToDemo: "Return to workflow",
    magicLinkTitle: "Email label",
    magicLinkDesc:
      "Use an email-style label locally. No message is sent.",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    sendMagicLink: "Preview label",
    magicLinkPendingTitle: "Ready to confirm locally",
    magicLinkPendingBody:
      "No email was sent to {email}. Confirm below to use that email name only in this tab.",
    confirmMagicLink: "Use this email label",
    toastDisplayNameSaved: "Display name saved as {name}",
    toastSignedOut: "Local profile cleared — back to Guest",
    toastMagicLinkStub: "Email demo recorded locally; no message was sent",
    toastMagicLinkConfirmed: "Local profile saved as {name}",
    errorInvalidEmail: "Enter a valid email address",
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
      "Filter by collection and component level, preview variants, and copy export-ready snippets for your next sprint.",
    searchLabel: "Search catalog",
    searchPlaceholder: "Search components…",
    domain: "Collection",
    tier: "Component level",
    tierAll: "all",
    domainAll: "All",
    domainProduct: "Product",
    domainUiLaws: "UILaws",
    domainLawsOfUx: "Laws of UX",
    keyboardHelp:
      "Press / to search, j and k to move through the list. Alt+1–4 changes collection; Alt+Shift+1–3 changes level.",
    visibleCount: "{count} visible",
    refs: "Refs:",
    refProductCatalog: "Product catalog",
    componentList: "Component list",
    tierSrOnly: "Level",
    domainSrOnly: "Collection",
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
    progressStepsAria: "Screenshot workflow steps",
    alertOfflineTitle: "Offline demo mode",
    alertOfflineBody:
      "The full Upload → Analyze → Preview flow still runs locally for your presentation.",
    alertOfflineReason: "Reason: {detail}",
    liveFlowLabel: "Live flow",
    headlineDefault: "Build a component preview",
    headlineFaster: "Ship scaffold-ready UI from one screenshot",
    subtitleDefault:
      "Ideal for rapid design reviews: analyze one screenshot, generate a scaffold, then reuse exported snippets across your next sprint.",
    subtitleFaster:
      "A faster path to conversion: upload, analyze, and export reusable React/Tailwind scaffolds in minutes.",
    modeLocalDemo: "Local demo mode",
    modeQwenReady: "Qwen route ready",
    recentAnalyses: "Recent analyses",
    recentAnalysesStored: "Stored locally (last {count})",
    recentAnalysesSavedBy: "Saved as {name}",
    removeSessionAria: "Remove {fileName} session",
    uploadedReference: "Uploaded reference",
    uploadedReferenceAlt: "Uploaded UI reference",
    uploadedReferenceAltNamed: "Uploaded UI reference: {fileName}",
    referenceImage: "Reference image",
    fileUnknownType: "unknown type",
    fileReady: "ready",
    errorInvalidImage: "Upload an image file: PNG, JPG, SVG, or WebP.",
    errorImageTooLarge:
      "Upload an image up to {maxSize}. Larger files can freeze the browser before preprocessing.",
    errorNoImage: "Choose an image before running analysis.",
    errorSampleLoad:
      "Could not load the sample screenshot. Upload your own image instead.",
    failureTitle: "Could not continue",
    loadingTitle: "Building preview",
    loadingBody:
      "Reading the screenshot, mapping layout, and preparing the generated component.",
    tryBundledReference: "Try a bundled reference",
    loadSampleAria: "Load {label} sample",
    loadSampleButton: "Load reference",
    loading: "Loading…",
    samplePathHint: "New here? Pick a reference, then run analysis.",
    samples: {
      dashboard: {
        label: "Dashboard",
        hint: "Tests cards, charts, activity feeds, and quick actions.",
      },
      auth: {
        label: "Sign in",
        hint: "Tests auth cards, form fields, and recovery links.",
      },
      mobile: {
        label: "Mobile app",
        hint: "Tests phone layouts, bottom navigation, and compact content.",
      },
      landing: {
        label: "Landing page",
        hint: "Tests hero sections, pricing, and marketing CTAs.",
      },
      settings: {
        label: "Settings",
        hint: "Tests profile forms, toggles, and preference panels.",
      },
      ecommerce: {
        label: "Shop catalog",
        hint: "Tests filters, product grids, and catalog actions.",
      },
      "stress-dashboard": {
        label: "Dense dashboard",
        hint: "Tests dense metrics, tables, and admin tools.",
      },
      "stress-list": {
        label: "Repeated list",
        hint: "Tests repeated rows, item actions, and list rhythm.",
      },
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
    copyShortShareLink: "Copy short share link",
    copying: "Copying…",
    creatingShareLink: "Creating link…",
    toastShareCopied: "Share link copied (read-only summary)",
    toastShortShareCopied: "Short share link copied (read-only summary)",
    toastShortShareMemory:
      "Short link copied, but it uses temporary memory storage until KV is configured",
    toastShareHashCopied: "Share link copied (hash fallback — read-only summary)",
    toastShareFailed: "Could not copy share link",
    defaultScreenshotName: "screenshot",
    exportScaffold: "Export scaffold",
    exportScaffoldDesc:
      "Review the generated files, then copy code, download TSX, or export the full production bundle.",
    exportReviewPackage: "Review package",
    exportPackageReady: "Production bundle",
    exportPackageReadyDesc:
      "Preview the files, screenshot changes, and handoff copy before downloading.",
    exportPackageTitle: "Review export package",
    exportPackageDesc:
      "This is the production-ready bundle created from the offline detection result. It keeps the component, recipe, manifest, tokens, and detection notes together.",
    exportPackageFilesLabel: "files",
    exportPackageFilesTab: "Files",
    exportPackageChangesTab: "Changes",
    exportPackageCopyTab: "Bundle copy",
    exportPackageFilesIntro:
      "Repo export downloads these files as a reviewable zip. The direct TSX download still exports only the component file.",
    exportPackageChangesIntro: "What changed from the uploaded screenshot:",
    exportPackageCopyIntro:
      "This is the plain-language bundle copy a teammate sees before importing the scaffold.",
    exportMetricFiles: "Files",
    exportMetricRegions: "Regions",
    exportMetricPrimitives: "Primitives",
    exportMetricTokens: "Tokens",
    exportChangeRegions:
      "{count} screenshot regions were converted into a {intent} component structure.",
    exportChangePrimitives:
      "{elements} detected elements were mapped into {count} shadcn-style primitives.",
    exportChangeResponsive:
      "Responsive intent was added: {mode} across {breakpoints}.",
    exportChangePatterns:
      "{count} repeated or structured UI pattern groups were preserved for review.",
    exportChangeCorrections:
      "{edited} manual edits and {excluded} excluded boxes are captured in the recipe.",
    exportChangePackage:
      "The export now includes {count} files: component, recipe, manifest, tokens, and detection notes.",
    exportReadmeIntent: "Screen intent",
    exportReadmeComponent: "Entry component",
    exportReadmeResponsive: "Responsive mode",
    exportReadmeContains: "What this bundle contains",
    exportReadmeNext: "Next steps",
    exportCopyAll: "Copy all",
    exportDownload: "Download .tsx",
    exportDesignDoc: "Design.md",
    exportHandoffBundle: "Handoff bundle",
    toastScaffoldCopied: "Scaffold copied",
    toastScaffoldExported: "Scaffold exported",
    toastDesignDocExported: "Design.md exported",
    toastHandoffBundleExported: "Handoff bundle exported",
    exportGenerateHint: "Generate preview to see live stats alongside the snippet.",
    generatedScaffold: "Generated scaffold",
    livePreview: "Live preview",
    detectionDetails: "Detection details",
    detectionElementType: "Element type",
    detectionInclude: "Include",
    detectionIncluded: "Included",
    detectionReset: "Reset",
    comparisonPreviewDesc:
      "Screenshot and generated mock are shown side by side; generated code is not executed.",
    comparisonScreenshot: "Screenshot",
    comparisonGeneratedMock: "Generated mock",
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

export type NotFoundDictionary = {
  [K in keyof (typeof en)["notFound"]]: string;
};

export type ShareDictionary = {
  [K in keyof (typeof en)["share"]]: string;
};

export type AccountDictionary = {
  [K in keyof (typeof en)["account"]]: string;
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
  notFound: NotFoundDictionary;
  share: ShareDictionary;
  account: AccountDictionary;
  demoBanner: DemoBannerDictionary;
  designSystem: DesignSystemDictionary;
  uploadFlow: UploadFlowDictionary;
};
