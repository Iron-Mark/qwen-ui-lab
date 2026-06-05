import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEMO_HEALTH_RESPONSE,
  buildDemoAnalyzeUiErrorResponse,
  buildDemoArtifactForFile,
  getSampleReferenceFile,
} from "../src/lib/demo-fixtures.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../e2e/fixtures");
const outFile = resolve(outDir, "demo-responses.json");

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

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Wrote ${outFile}`);
