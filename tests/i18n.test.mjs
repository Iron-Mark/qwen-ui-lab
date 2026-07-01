import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { resolveLocale } from "../src/lib/i18n/locale.mjs";
import { interpolate } from "../src/lib/i18n/interpolate.mjs";
import { localizedHref } from "../src/lib/i18n/localized-href.mjs";
import {
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

const uploadFlowZh = {
  ctaAnalyzing: "分析中…",
  analyzeStepReading: "读取图片…",
  analyzeStepPreprocessing: "预处理图片…",
    analyzeStepChecking: "准备分析…",
  analyzeStepLayout: "分析布局…",
  analyzeStepBuilding: "生成预览…",
  progressCallingApi: "调用 Qwen 视觉 API…",
  stepUpload: "上传",
  stepAnalyze: "分析",
  stepPlan: "计划",
  stepGenerate: "生成",
  stepPreview: "预览",
  stepExport: "导出",
};

test("resolveLocale defaults to en and accepts zh", () => {
  assert.equal(resolveLocale(null), "en");
  assert.equal(resolveLocale("zh"), "zh");
  assert.equal(resolveLocale("fr"), "en");
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
    translateAnalyzeStep("Calling Qwen vision API…", uploadFlowZh),
    "调用 Qwen 视觉 API…",
  );
});

test("getFlowStepLabels returns localized step labels", () => {
  assert.equal(
    getFlowStepLabels(uploadFlowZh)
      .map((step) => step.label)
      .join(","),
    "上传,分析,计划,生成,预览,导出",
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

test("zh dictionaries cover remaining route strings", () => {
  assert.match(zhDictionarySource, /title:\s*"页面未找到"/);
  assert.match(zhDictionarySource, /title:\s*"只读分析摘要"/);
  assert.match(zhDictionarySource, /backToWorkflow:\s*"返回工作流"/);
  assert.match(enDictionarySource, /title:\s*"Page not found"/);
  assert.match(enDictionarySource, /backToWorkflow:\s*"Back to workflow"/);
});

test("en public copy avoids test-runner wording in sample picker labels", () => {
  assert.match(enDictionarySource, /domainUiLaws:\s*"UI Laws"/);
  assert.doesNotMatch(enDictionarySource, /hint:\s*"Tests\b/);
  assert.doesNotMatch(enDictionarySource, /domainUiLaws:\s*"UILaws"/);
});

test("export package preview surfaces correction metrics", () => {
  assert.match(enDictionarySource, /exportMetricEdits:\s*"Edits"/);
  assert.match(enDictionarySource, /exportMetricExcluded:\s*"Excluded"/);
  assert.match(zhDictionarySource, /exportMetricEdits:\s*"修正"/);
  assert.match(zhDictionarySource, /exportMetricExcluded:\s*"排除"/);
  assert.match(uploadFlowSource, /label:\s*copy\.exportMetricEdits/);
  assert.match(uploadFlowSource, /label:\s*copy\.exportMetricExcluded/);
  assert.match(uploadFlowSource, /correctionNotice:\s*editedCount \|\| excludedCount/);
  assert.match(uploadFlowSource, /preview\.correctionNotice/);
  assert.match(uploadFlowSource, /<AlertTitle>\{copy\.exportReadmeCorrections\}<\/AlertTitle>/);
});

test("export package tabs use product-facing package notes language", () => {
  assert.match(enDictionarySource, /exportPackageCopyTab:\s*"Package notes"/);
  assert.match(enDictionarySource, /Use these notes to review the generated package/);
  assert.match(zhDictionarySource, /exportPackageCopyTab:\s*"包备注"/);
});
