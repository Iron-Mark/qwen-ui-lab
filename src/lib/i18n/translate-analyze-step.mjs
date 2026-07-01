const EN_PROGRESS_TO_KEY = {
  "Preparing analysis…": "progressCheckingProvider",
  "Checking provider…": "progressCheckingProvider",
  "Preparing preview…": "progressBuildingOffline",
  "Building local analysis…": "progressBuildingOffline",
  "Calling Qwen vision API…": "progressCallingApi",
  "Analyzing screenshot…": "progressCallingApi",
  "Retrying after transient error…": "progressRetrying",
  "Analysis complete": "progressComplete",
  "Reading image…": "analyzeStepReading",
  "Preprocessing image…": "analyzeStepPreprocessing",
  "Analyzing layout…": "analyzeStepLayout",
  "Generating preview…": "analyzeStepBuilding",
  "Building artifact…": "analyzeStepBuilding",
};

export function translateAnalyzeStep(step, copy) {
  if (!step) return copy.ctaAnalyzing;
  const key = EN_PROGRESS_TO_KEY[step];
  return key ? copy[key] : step;
}

export function getAnalyzeStepLabels(copy) {
  return [
    copy.analyzeStepReading,
    copy.analyzeStepPreprocessing,
    copy.analyzeStepChecking,
    copy.analyzeStepLayout,
    copy.analyzeStepBuilding,
  ];
}

export function getFlowStepLabels(copy) {
  return [
    { id: "upload", label: copy.stepUpload },
    { id: "analyze", label: copy.stepAnalyze },
    { id: "plan", label: copy.stepPlan },
    { id: "generate", label: copy.stepGenerate },
    { id: "preview", label: copy.stepPreview },
    { id: "export", label: copy.stepExport },
  ];
}

const EN_STEP_ORDER = [
  "Reading image…",
  "Preprocessing image…",
  "Preparing analysis…",
  "Analyzing layout…",
  "Generating preview…",
];

const PROGRESS_INDEX = {
  "Preparing analysis…": 2,
  "Checking provider…": 2,
  "Preparing preview…": 3,
  "Building local analysis…": 3,
  "Calling Qwen vision API…": 3,
  "Analyzing screenshot…": 3,
  "Retrying after transient error…": 3,
  "Analysis complete": 4,
};

export function resolveAnalyzeStepIndex(step) {
  if (!step) return -1;
  const base = EN_STEP_ORDER.indexOf(step);
  if (base >= 0) return base;
  return PROGRESS_INDEX[step] ?? -1;
}

export function getAnalyzeProgressPercent(step, totalSteps = EN_STEP_ORDER.length) {
  const idx = resolveAnalyzeStepIndex(step);
  return idx >= 0 ? ((idx + 1) / totalSteps) * 100 : 0;
}
