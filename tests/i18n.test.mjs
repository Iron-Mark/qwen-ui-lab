import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { resolveLocale } from "../src/lib/i18n/locale.mjs";
import { interpolate } from "../src/lib/i18n/interpolate.mjs";
import { localizedHref } from "../src/lib/i18n/localized-href.mjs";
import {
  getAnalyzeStepLabels,
  getFlowStepLabels,
  translateAnalyzeStep,
} from "../src/lib/i18n/translate-analyze-step.mjs";
import {
  buildDesignSystemDomainRedirect,
  createDesignSystemSearchParams,
} from "../src/features/design-system/lib/design-system-state.mjs";

const enDictionarySource = readFileSync(
  fileURLToPath(new URL("../src/lib/i18n/dictionaries/en.ts", import.meta.url)),
  "utf8",
);
const zhDictionarySource = readFileSync(
  fileURLToPath(new URL("../src/lib/i18n/dictionaries/zh.ts", import.meta.url)),
  "utf8",
);
const uploadFlowSource = readFileSync(
  fileURLToPath(new URL("../src/features/analysis/components/UploadFlow.tsx", import.meta.url)),
  "utf8",
);
const translateAnalyzeStepSource = readFileSync(
  fileURLToPath(new URL("../src/lib/i18n/translate-analyze-step.mjs", import.meta.url)),
  "utf8",
);

const uploadFlowZh = {
  ctaAnalyzing: "\u5206\u6790\u4e2d\u2026",
  analyzeStepReading: "\u8bfb\u53d6\u56fe\u7247\u2026",
  analyzeStepPreprocessing: "\u9884\u5904\u7406\u56fe\u7247\u2026",
  analyzeStepChecking: "\u51c6\u5907\u5206\u6790\u2026",
  analyzeStepLayout: "\u5206\u6790\u5e03\u5c40\u2026",
  analyzeStepBuilding: "\u51c6\u5907\u9884\u89c8\u2026",
  progressCheckingProvider: "\u51c6\u5907\u5206\u6790\u2026",
  progressCallingApi: "\u5206\u6790\u622a\u56fe\u2026",
  stepUpload: "\u4e0a\u4f20",
  stepAnalyze: "\u5206\u6790",
  stepPlan: "\u8ba1\u5212",
  stepGenerate: "\u51c6\u5907",
  stepPreview: "\u9884\u89c8",
  stepExport: "\u5bfc\u51fa",
};

test("resolveLocale defaults to en and accepts zh", () => {
  assert.equal(resolveLocale(null), "en");
  assert.equal(resolveLocale("zh"), "zh");
  assert.equal(resolveLocale("fr"), "en");
});

test("zh export package copy avoids merge-gate wording", () => {
  assert.match(zhDictionarySource, /exportReadmeReviewSummary:\s*".*\u4ea4\u63a5\u65f6/);
  assert.match(zhDictionarySource, /exportReadmeReviewClear:\s*".*\u4ea4\u63a5\u65f6/);
  assert.match(zhDictionarySource, /React \+ Tailwind \u8d77\u59cb\u9879\u76ee\u5305/);
  assert.match(zhDictionarySource, /exportPackageTitle:\s*"\u68c0\u89c6\u5bfc\u51fa\u9879\u76ee\u5305"/);
  assert.match(zhDictionarySource, /exportPackageCopyIntro:\s*".*\u8d77\u59cb\u9879\u76ee\u5305/);
  assert.doesNotMatch(zhDictionarySource, /\u5bfc\u5165\u524d/);
  assert.doesNotMatch(zhDictionarySource, /\u5408\u5e76\u524d/);
  assert.doesNotMatch(zhDictionarySource, /React \+ Tailwind \u9879\u76ee\u5305/);
});

test("interpolate replaces placeholders", () => {
  assert.equal(
    interpolate("Stored locally (last {count})", { count: 3 }),
    "Stored locally (last 3)",
  );
});

test("localizedHref appends lang=zh", () => {
  assert.equal(localizedHref("/", "en"), "/");
  assert.equal(localizedHref("/design-system", "zh"), "/design-system?lang=zh");
});

test("translateAnalyzeStep maps progress strings", () => {
  assert.equal(
    translateAnalyzeStep("Analyzing screenshot\u2026", uploadFlowZh),
    "\u5206\u6790\u622a\u56fe\u2026",
  );
});

test("legacy provider progress maps to user-facing analysis copy", () => {
  assert.equal(
    translateAnalyzeStep("Checking provider\u2026", uploadFlowZh),
    "\u51c6\u5907\u5206\u6790\u2026",
  );
  assert.doesNotMatch(
    getAnalyzeStepLabels(uploadFlowZh).join(" "),
    /provider|api key|qwen|demo|fallback/i,
  );
});

test("progress translator avoids raw provider operation labels", () => {
  assert.doesNotMatch(translateAnalyzeStepSource, /Calling Qwen vision API/);
  assert.doesNotMatch(translateAnalyzeStepSource, /Retrying after transient error/);
  assert.equal(
    translateAnalyzeStep("Retrying analysis\u2026", {
      ...uploadFlowZh,
      progressRetrying: "\u91cd\u8bd5\u5206\u6790\u2026",
    }),
    "\u91cd\u8bd5\u5206\u6790\u2026",
  );
});

test("getFlowStepLabels returns localized step labels", () => {
  assert.equal(
    getFlowStepLabels(uploadFlowZh)
      .map((step) => step.label)
      .join(","),
    "\u4e0a\u4f20,\u5206\u6790,\u8ba1\u5212,\u51c6\u5907,\u9884\u89c8,\u5bfc\u51fa",
  );
});

test("createDesignSystemSearchParams preserves lang=zh", () => {
  const params = createDesignSystemSearchParams({
    domain: "product",
    level: "all",
    query: "",
    selected: null,
    previewMode: "desktop",
    lang: "zh",
  });
  assert.equal(params.toString(), "domain=product&lang=zh");
});

test("buildDesignSystemDomainRedirect preserves lang=zh", () => {
  assert.equal(
    buildDesignSystemDomainRedirect("laws-of-ux", "zh"),
    "/design-system?domain=laws-of-ux&lang=zh",
  );
  assert.equal(
    buildDesignSystemDomainRedirect("uilaws", "zh"),
    "/design-system?domain=uilaws&lang=zh",
  );
  assert.equal(
    buildDesignSystemDomainRedirect("laws-of-ux", "en"),
    "/design-system?domain=laws-of-ux",
  );
});

test("localizedHref preserves share and account paths", () => {
  assert.equal(localizedHref("/share/Ab12Cd34", "zh"), "/share/Ab12Cd34?lang=zh");
  assert.equal(localizedHref("/account", "zh"), "/account?lang=zh");
});

test("account profile copy stays modal-focused", () => {
  assert.match(enDictionarySource, /modeGuest:\s*"Guest profile"/);
  assert.match(enDictionarySource, /modeNamed:\s*"Named profile"/);
  assert.match(enDictionarySource, /subtitle:\s*"Manage the name shown in saved analyses and the app header\."/);
  assert.match(enDictionarySource, /contactLabelPendingBody:\s*"\s*Use \{email\} as the contact label/);
  assert.match(zhDictionarySource, /modeGuest:\s*"\\u8bbf\\u5ba2\\u8d44\\u6599"/);
  assert.match(zhDictionarySource, /modeNamed:\s*"\\u5df2\\u547d\\u540d\\u8d44\\u6599"/);
  assert.doesNotMatch(enDictionarySource, /Local only|Saved name|This browser only|local label/);
  assert.doesNotMatch(zhDictionarySource, /\u4ec5\u672c\u5730|\\u4ec5\\u672c\\u5730/);
});

test("zh dictionaries cover remaining route strings", () => {
  assert.match(zhDictionarySource, /title:\s*"\u9875\u9762\u672a\u627e\u5230"/);
  assert.match(zhDictionarySource, /title:\s*"\u53ea\u8bfb\u5206\u6790\u6458\u8981"/);
  assert.match(zhDictionarySource, /backToWorkflow:\s*"\u8fd4\u56de\u5de5\u4f5c\u6d41"/);
  assert.match(enDictionarySource, /title:\s*"Page not found"/);
  assert.match(enDictionarySource, /backToWorkflow:\s*"Back to workflow"/);
});

test("en public copy avoids test-runner wording in sample picker labels", () => {
  assert.match(enDictionarySource, /domainUiLaws:\s*"UI Laws"/);
  assert.doesNotMatch(enDictionarySource, /hint:\s*"Tests\b/);
  assert.doesNotMatch(enDictionarySource, /domainUiLaws:\s*"UILaws"/);
});

test("zh sample picker copy uses sample-run language", () => {
  const sampleRun = "\u6837\u4f8b\u8fd0\u884c";
  const sampleScreenshot = "\u6837\u4f8b\u622a\u56fe";
  const loadReferenceImage = "\u52a0\u8f7d\u53c2\u8003\u56fe";

  assert.match(zhDictionarySource, new RegExp(`sampleRun:\\s*"${sampleRun}"`));
  assert.match(zhDictionarySource, new RegExp(`trySampleRun:\\s*"\u8bd5\u7528${sampleRun}"`));
  assert.match(zhDictionarySource, /loadSampleAria:\s*"\u52a0\u8f7d \{label\} \u5e03\u5c40"/);
  assert.match(zhDictionarySource, /toastSampleLoaded:\s*"\u5df2\u52a0\u8f7d \{label\} \u5e03\u5c40"/);
  assert.match(zhDictionarySource, new RegExp(`toastSampleLoadFailed:\\s*"\u65e0\u6cd5\u52a0\u8f7d${sampleRun}"`));
  assert.doesNotMatch(zhDictionarySource, new RegExp(sampleScreenshot));
  assert.doesNotMatch(zhDictionarySource, new RegExp(loadReferenceImage));
});

test("export package preview surfaces review update metrics", () => {
  assert.match(enDictionarySource, /exportMetricEdits:\s*"Updated"/);
  assert.match(enDictionarySource, /exportMetricExcluded:\s*"Hidden"/);
  assert.match(zhDictionarySource, /exportMetricEdits:\s*"\u66f4\u65b0"/);
  assert.match(zhDictionarySource, /exportMetricExcluded:\s*"\u9690\u85cf"/);
  assert.match(uploadFlowSource, /label:\s*copy\.exportMetricEdits/);
  assert.match(uploadFlowSource, /label:\s*copy\.exportMetricExcluded/);
  assert.match(uploadFlowSource, /correctionNotice:\s*editedCount \|\| excludedCount/);
  assert.match(uploadFlowSource, /preview\.correctionNotice/);
  assert.match(uploadFlowSource, /<AlertTitle>\{copy\.exportReadmeCorrections\}<\/AlertTitle>/);
});

test("export package tabs use product-facing project guide language", () => {
  assert.match(enDictionarySource, /exportPackageCopyTab:\s*"Project guide"/);
  assert.match(enDictionarySource, /This starter package is created from the screenshot analysis/);
  assert.match(enDictionarySource, /The starter package includes \{count\} files/);
  assert.match(enDictionarySource, /Use these notes to review the starter package/);
  assert.match(enDictionarySource, /generatedScaffold:\s*"Starter component"/);
  assert.match(enDictionarySource, /comparisonGeneratedPreview:\s*"Component preview"/);
  assert.match(enDictionarySource, /toastPreviewGenerated:\s*"Preview ready"/);
  assert.match(enDictionarySource, /toastPreviewRegenerated:\s*"Preview refreshed"/);
  assert.doesNotMatch(enDictionarySource, /generatedScaffold:\s*"Generated component"/);
  assert.doesNotMatch(enDictionarySource, /toastPreviewGenerated:\s*"Preview generated"/);
  assert.doesNotMatch(enDictionarySource, /This export package is created/);
  assert.doesNotMatch(enDictionarySource, /The export now includes/);
  assert.match(zhDictionarySource, /exportPackageCopyTab:\s*"\u9879\u76ee\u6307\u5357"/);
  assert.match(zhDictionarySource, /generatedScaffold:\s*"\u8d77\u59cb\u7ec4\u4ef6"/);
  assert.match(zhDictionarySource, /comparisonGeneratedPreview:\s*"\u7ec4\u4ef6\u9884\u89c8"/);
  assert.match(zhDictionarySource, /toastPreviewGenerated:\s*"\u9884\u89c8\u5df2\u5c31\u7eea"/);
  assert.match(zhDictionarySource, /toastPreviewRegenerated:\s*"\u9884\u89c8\u5df2\u5237\u65b0"/);
  assert.match(zhDictionarySource, /statusPreviewReady:\s*"\u9884\u89c8\u5c31\u7eea[^"]*\u8d77\u59cb\u7ec4\u4ef6/);
  assert.doesNotMatch(zhDictionarySource, /\u751f\u6210\u9884\u89c8/);
  assert.doesNotMatch(zhDictionarySource, /\u751f\u6210\u7ec4\u4ef6/);
  assert.doesNotMatch(zhDictionarySource, /\u751f\u6210\u5305/);
});

test("upload status copy separates pre-analysis and review-ready states", () => {
  assert.match(enDictionarySource, /modeLocalReady:\s*"Ready to analyze"/);
  assert.match(enDictionarySource, /modeReviewReady:\s*"Ready for review"/);
  assert.match(enDictionarySource, /ctaGenerate:\s*"Prepare preview"/);
  assert.match(enDictionarySource, /ctaRegenerate:\s*"Refresh preview"/);
  assert.match(enDictionarySource, /ctaAnalyzePreview:\s*"Analyze & prepare preview"/);
  assert.doesNotMatch(enDictionarySource, /Generate preview/);
  assert.doesNotMatch(enDictionarySource, /Generating preview/);
  assert.doesNotMatch(enDictionarySource, /Regenerate preview/);
  assert.doesNotMatch(enDictionarySource, /Analyze & generate preview/);
  assert.doesNotMatch(enDictionarySource, /Ship React-ready/);
  assert.doesNotMatch(enDictionarySource, /faster path to conversion/);
  assert.match(enDictionarySource, /headlineFaster:\s*"Turn one screenshot into starter UI"/);
  assert.match(enDictionarySource, /loadingTitle:\s*"Preparing preview"/);
  assert.match(zhDictionarySource, /modeReviewReady:\s*"\u53ef\u4ee5\u5f00\u59cb\u590d\u6838"/);
  assert.match(zhDictionarySource, /ctaAnalyzeNow:\s*"\u7acb\u5373\u5206\u6790"/);
});
