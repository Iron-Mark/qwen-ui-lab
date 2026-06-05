import test from "node:test";
import assert from "node:assert/strict";

import { resolveLocale } from "../src/lib/i18n/locale.mjs";
import { interpolate } from "../src/lib/i18n/interpolate.mjs";
import { localizedHref } from "../src/lib/i18n/localized-href.mjs";
import {
  getAnalyzeStepLabels,
  getFlowStepLabels,
  translateAnalyzeStep,
} from "../src/lib/i18n/translate-analyze-step.mjs";
import { createDesignSystemSearchParams } from "../src/lib/design-system-state.mjs";

const uploadFlowZh = {
  ctaAnalyzing: "分析中…",
  analyzeStepReading: "读取图片…",
  analyzeStepPreprocessing: "预处理图片…",
  analyzeStepChecking: "检查提供方…",
  analyzeStepLayout: "分析布局…",
  analyzeStepBuilding: "构建产物…",
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
