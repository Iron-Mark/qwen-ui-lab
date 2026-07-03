export const en = {
  hero: {
    badgeProduct: "Screenshot to React",
    badgeOffline: "Local preview",
    title: "Turn screenshots into editable React",
    subtitle:
      "Upload a UI screenshot, inspect the detected structure, then export a React + Tailwind package.",
    ctaPrimary: "Start workflow",
    ctaSecondary: "Browse components",
    sampleRun: "Sample run",
    trustBrowserSafe: "Browser-safe by default",
    trustOffline: "Runs locally",
    benefitUploadLabel: "Plan",
    benefitUploadTitle: "Map the layout",
    benefitUploadBody:
      "Find sections, cards, controls, and repeated groups while the preview is prepared.",
    benefitAnalyzeLabel: "Preview",
    benefitAnalyzeTitle: "Inspect the component",
    benefitAnalyzeBody:
      "Review the React + Tailwind starter alongside the package preview.",
    benefitDesignLabel: "Export",
    benefitDesignTitle: "Export the package",
    benefitDesignBody:
      "Review TSX, Design.md, and package files during handoff.",
    trustSignalsAria: "Trust signals",
    keyBenefitsAria: "Key benefits",
  },
  header: {
    siteTitle: "qwen-ui-lab",
    siteTagline: "Screenshot to React",
    navMainAria: "Main",
    navWorkflow: "Workflow",
    navWorkflowAria: "Workflow",
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
    backToWorkflow: "Back to workflow",
    designSystem: "Design system",
    suggestedPages: "Suggested pages",
  },
  share: {
    eyebrow: "Share link",
    title: "Read-only analysis summary",
    descriptionLead: "This link includes",
    descriptionTrail: "- summary and detected layout only, no source files.",
    backToWorkflow: "Back to workflow",
    sampleRun: "Sample run",
    openSampleRun: "Open sample run",
    metadataNotFoundTitle: "Share not found",
    metadataNotFoundDescription:
      "This read-only analysis summary link is missing or expired.",
    metadataTitle: "Shared summary - {file}",
    notFoundTitle: "Share link unavailable",
    notFoundDescription:
      "This read-only analysis summary was not found. The link may have expired or may no longer be available.",
    notFoundStorageHint:
      "Create a new share link from the workflow when you need a fresh summary.",
    notFoundRecoveryTitle: "What you can do next",
    notFoundRecoveryWorkflow: "Create a new summary from the workflow.",
    notFoundRecoverySample: "Open a sample run to inspect the export flow.",
  },
  account: {
    eyebrow: "Profile",
    title: "Profile",
    subtitle: "Choose the display name used for saved analyses.",
    statusTitle: "Local profile",
    statusDesc: "Used by the header and recent analysis list.",
    profilePreviewDesc: "Label for saved analyses",
    localFactsTitle: "What stays local",
    currentLabelTitle: "Shown as",
    modeGuest: "Local only",
    modeNamed: "Saved name",
    savedScaffoldsAs: 'Saved analyses show as "{name}"',
    displayNameTitle: "Display name",
    displayNameDesc:
      "Used for saved analyses in this browser. Leave blank to use Guest.",
    displayNameLabel: "Name",
    displayNamePlaceholder: "e.g. Alex",
    saveDisplayName: "Save changes",
    signOut: "Clear profile",
    backToWorkflow: "Back to workflow",
    contactLabelTitle: "Contact label",
    contactLabelDesc:
      "Optionally use an email-style label for this browser only.",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    saveContactLabel: "Save contact label",
    contactLabelPendingTitle: "Confirm contact label",
    contactLabelPendingBody:
      "Use {email} as the local label for saved analyses in this browser.",
    confirmContactLabel: "Use contact label",
    toastDisplayNameSaved: "Display name saved as {name}",
    toastSignedOut: "Local profile cleared - back to Guest",
    toastContactLabelReady: "Contact label ready",
    toastContactLabelConfirmed: "Local profile saved as {name}",
    errorInvalidEmail: "Enter a valid email address",
  },
  designSystem: {
    eyebrow: "Design system",
    title: "Component library",
    subtitle:
      "Filter reusable components, preview variants, and copy review-ready snippets for your next build.",
    searchLabel: "Search catalog",
    searchPlaceholder: "Search components...",
    domain: "Collection",
    tier: "Component level",
    tierAll: "all",
    domainAll: "All",
    domainProduct: "Product",
    domainUiLaws: "UI Laws",
    domainLawsOfUx: "Laws of UX",
    keyboardHelp:
      "Press / to search, j and k to move through the list. Alt+1-4 changes collection; Alt+Shift+1-3 changes level.",
    visibleCount: "{count} visible",
    refs: "Refs:",
    refProductCatalog: "Product catalog",
    componentList: "Component list",
    tierSrOnly: "Level",
    domainSrOnly: "Collection",
    noResults: "No components match your search.",
    previewToolbarAria: "Preview panel actions",
    exportAll: "Export all snippets",
    tryWorkflow: "Try screenshot-to-React workflow ->",
    pickComponent: "Pick a component from the list to inspect preview, props, and snippet.",
    snippetsDownloaded: "Design system snippets downloaded",
    renderError: "Could not render {name}.",
  },
  uploadFlow: {
    sharedSummaryTitle: "Shared result",
    sharedSummaryDescription: "Read-only summary",
    ctaAnalyzing: "Analyzing...",
    analyzeStepReading: "Reading image...",
    analyzeStepPreprocessing: "Preprocessing image...",
    analyzeStepChecking: "Preparing analysis...",
    analyzeStepLayout: "Analyzing layout...",
    analyzeStepBuilding: "Preparing preview...",
    progressCheckingProvider: "Preparing analysis...",
    progressBuildingOffline: "Preparing preview...",
    progressCallingApi: "Analyzing screenshot...",
    progressRetrying: "Retrying analysis...",
    progressComplete: "Analysis complete",
    stepUpload: "Upload",
    stepAnalyze: "Analyze",
    stepPlan: "Plan",
    stepGenerate: "Prepare",
    stepPreview: "Preview",
    stepExport: "Export",
    progressStepsAria: "Screenshot workflow steps",
    alertOfflineTitle: "Ready to analyze",
    alertOfflineBody:
      "Upload, detection, preview, and export are ready.",
    alertOfflineReason: "Reason: {detail}",
    liveFlowLabel: "Screenshot workflow",
    headlineDefault: "Build a component preview",
    headlineFaster: "Turn one screenshot into starter UI",
    subtitleDefault:
      "Ideal for rapid design reviews: analyze one screenshot, review a starter component, then reuse exported snippets in your next iteration.",
    subtitleFaster:
      "Upload, analyze, and export reusable React/Tailwind starter components in minutes.",
    modeLocalReady: "Ready to analyze",
    modeQwenReady: "Ready to analyze",
    modeReviewReady: "Ready for review",
    recentAnalyses: "Recent analyses",
    recentAnalysesStored: "Stored locally (last {count})",
    recentAnalysesSavedBy: "Saved as {name}",
    removeSessionAria: "Remove {fileName} session",
    uploadedReference: "Uploaded screenshot",
    uploadedReferenceAlt: "Uploaded UI screenshot",
    uploadedReferenceAltNamed: "Uploaded UI screenshot: {fileName}",
    referenceImage: "Screenshot",
    fileUnknownType: "unknown type",
    fileReady: "ready",
    errorInvalidImage: "Upload an image file: PNG, JPG, SVG, or WebP.",
    errorImageTooLarge:
      "Upload an image up to {maxSize}. Larger files can freeze the browser before preprocessing.",
    errorNoImage: "Choose an image before running analysis.",
    errorSampleLoad:
      "Could not load the sample run. Upload your own image instead.",
    failureTitle: "Could not continue",
    loadingTitle: "Preparing preview",
    loadingBody:
      "Reading the screenshot, mapping layout, and preparing the starter component.",
    trySampleRun: "Try a sample run",
    loadSampleAria: "Load {label} sample",
    loadSampleButton: "Load sample",
    loading: "Loading...",
    samplePathHint: "New here? Pick a sample run, then analyze it.",
    samples: {
      dashboard: {
        label: "Dashboard",
        hint: "Cards, charts, activity feeds, and quick actions.",
      },
      auth: {
        label: "Sign in",
        hint: "Auth cards, form fields, and recovery links.",
      },
      mobile: {
        label: "Mobile app",
        hint: "Phone layouts, bottom navigation, and compact content.",
      },
      landing: {
        label: "Landing page",
        hint: "Hero sections, pricing, and marketing CTAs.",
      },
      settings: {
        label: "Settings",
        hint: "Profile forms, toggles, and preference panels.",
      },
      ecommerce: {
        label: "Shop catalog",
        hint: "Filters, product grids, and catalog actions.",
      },
      "stress-dashboard": {
        label: "Dense dashboard",
        hint: "Dense metrics, tables, and admin tools.",
      },
      "stress-list": {
        label: "Repeated list",
        hint: "Repeated rows, item actions, and list rhythm.",
      },
    },
    ctaRegenerate: "Refresh preview",
    ctaGenerate: "Prepare preview",
    ctaAnalyzeNow: "Analyze now",
    ctaAnalyzePreview: "Analyze & prepare preview",
    progressLabel: "{step} ({percent}%)",
    statusQwenComplete:
      "Analysis complete - open the preview to see the starter component.",
    statusAnalysisComplete:
      "Analysis complete - open the preview to see the starter component.",
    statusPreviewReady:
      "Preview ready - copy or export the starter component from the panel on the right.",
    analysisOutputLabel: "Analysis output (screenshot on the left)",
    copyShareLink: "Copy share link",
    copyShortShareLink: "Copy short share link",
    copying: "Copying...",
    creatingShareLink: "Creating link...",
    toastShareCopied: "Share link copied (read-only summary)",
    toastShortShareCopied: "Short share link copied (read-only summary)",
    toastShortShareMemory:
      "Short link copied. It may expire sooner than a permanent share link.",
    toastShareHashCopied: "Share link copied (read-only summary)",
    toastShareFailed: "Could not copy share link",
    defaultScreenshotName: "screenshot",
    exportScaffold: "Export component",
    exportScaffoldDesc:
      "Review the starter files, then copy code, download the component, or export the package.",
    exportReviewPackage: "Review package",
    exportPackageReady: "Export package",
    exportPackageReadyDesc:
      "Preview the files, screenshot changes, and package summary before downloading.",
    exportPackageTitle: "Review export package",
    exportPackageDesc:
      "This export package is created from the screenshot analysis. It keeps the component, recipe, manifest, tokens, and detection notes together.",
    exportPackageFilesLabel: "files",
    exportPackageFilesTab: "Files",
    exportPackageChangesTab: "Changes",
    exportPackageCopyTab: "Project guide",
    exportPackageFilesIntro:
      "Package export downloads these files as an inspectable zip. The direct component download exports only the TSX file.",
    exportPackageChangesIntro: "What changed from the uploaded screenshot:",
    exportPackageCopyIntro:
      "Use these notes to review the starter package during project handoff.",
    exportMetricFiles: "Files",
    exportMetricRegions: "Regions",
    exportMetricPrimitives: "Primitives",
    exportMetricEdits: "Edits",
    exportMetricExcluded: "Excluded",
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
      "{edited} edited boxes and {excluded} omitted boxes are captured in the recipe.",
    exportChangePackage:
      "The export now includes {count} files: design notes, component, recipe, manifest, tokens, and detection notes.",
    exportReadmeIntent: "Screen intent",
    exportReadmeComponent: "Entry component",
    exportReadmeResponsive: "Responsive mode",
    exportReadmeCorrections: "Review changes",
    exportReadmeNoCorrections: "No review changes captured.",
    exportReadmeReviewNotes: "Review notes",
    exportReadmeReviewSummary:
      "{count} low-confidence element(s) need review during handoff.",
    exportReadmeReviewClear: "Use the checklist during handoff.",
    exportReadmeContains: "What this package contains",
    exportReadmeNext: "Next steps",
    exportCopyAll: "Copy all",
    exportDownload: "Download component",
    exportDesignDoc: "Design.md",
    exportMoreOptions: "More export options",
    exportDownloadPackage: "Download package",
    exportRepoInstructions: "Open PR instructions",
    toastScaffoldCopied: "Component copied",
    toastScaffoldExported: "Component exported",
    toastDesignDocExported: "Design.md exported",
    toastPackageDownloaded: "Export package downloaded",
    exportGenerateHint: "Prepare preview to see live stats alongside the snippet.",
    generatedScaffold: "Starter component",
    livePreview: "Live preview",
    detectionDetails: "Detection details",
    detectionElementType: "Element type",
    detectionInclude: "Include",
    detectionIncluded: "Included",
    detectionReset: "Reset",
    comparisonPreviewDesc:
      "Screenshot and component preview are shown side by side; exported code is not executed here.",
    comparisonScreenshot: "Screenshot",
    comparisonGeneratedPreview: "Component preview",
    emptyState: "Upload a screenshot and run analysis to see the plan.",
    toastAnalysisReady: "Analysis ready",
    toastQwenComplete: "Analysis ready",
    toastFallback: "Analysis ready",
    toastAnalyzeFailed: "Preview prepared",
    toastPreviewGenerated: "Preview ready",
    toastPreviewRegenerated: "Preview refreshed",
    toastRestoredQwen: "Restored analysis session",
    toastRestoredAnalysis: "Restored analysis session",
    toastRestoredSession: "Restored session: {fileName}",
    toastSessionRemoved: "Session removed",
    toastSampleLoaded: "{label} sample loaded",
    toastSampleLoadFailed: "Could not load sample run",
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

export type DesignSystemDictionary = {
  [K in keyof (typeof en)["designSystem"]]: string;
};

export type Dictionary = {
  hero: HeroDictionary;
  header: HeaderDictionary;
  notFound: NotFoundDictionary;
  share: ShareDictionary;
  account: AccountDictionary;
  designSystem: DesignSystemDictionary;
  uploadFlow: UploadFlowDictionary;
};

