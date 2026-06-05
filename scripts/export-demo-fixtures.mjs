import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEMO_HEALTH_RESPONSE,
  buildDemoAnalyzeUiErrorResponse,
  buildDemoArtifactForFile,
  getSampleReferenceFile,
} from "../src/lib/demo-fixtures.mjs";
import {
  LIVE_QWEN_HEALTH_RESPONSE,
  MOCK_QWEN_ANALYSIS_JSON,
  buildMockLiveAnalyzeUiRouteResponse,
} from "../src/lib/qwen-mock-fixtures.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../e2e/fixtures");
const outFile = resolve(outDir, "demo-responses.json");
const liveOutFile = resolve(outDir, "live-qwen-responses.json");

const sampleFile = getSampleReferenceFile();
const sampleArtifact = buildDemoArtifactForFile(sampleFile);

const payload = {
  health: DEMO_HEALTH_RESPONSE,
  analyzeUiError: buildDemoAnalyzeUiErrorResponse(),
  sampleFile,
  sampleArtifact: {
    planTitles: sampleArtifact.plan.map((section) => section.title),
    previewStats: sampleArtifact.previewStats,
    modeLabel: sampleArtifact.modeLabel,
    summary: sampleArtifact.summary,
  },
};

const liveAnalyzeSuccess = buildMockLiveAnalyzeUiRouteResponse(sampleFile);
const livePayload = {
  health: LIVE_QWEN_HEALTH_RESPONSE,
  analyzeUiSuccess: liveAnalyzeSuccess,
  artifactContract: {
    planTitles: liveAnalyzeSuccess.artifact.plan.map((section) => section.title),
    previewStats: liveAnalyzeSuccess.artifact.previewStats,
    modeLabel: liveAnalyzeSuccess.artifact.modeLabel,
    summary: liveAnalyzeSuccess.artifact.summary,
    generatedCodeMarker: MOCK_QWEN_ANALYSIS_JSON.generatedCode.match(
      /export function (\w+)/,
    )?.[1],
  },
};

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
writeFileSync(liveOutFile, `${JSON.stringify(livePayload, null, 2)}\n`, "utf8");
console.log(`Wrote ${outFile}`);
console.log(`Wrote ${liveOutFile}`);
