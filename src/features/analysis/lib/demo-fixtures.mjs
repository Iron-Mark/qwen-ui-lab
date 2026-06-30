import { buildUiFlowArtifact } from "./ui-flow.mjs";
import { DEFAULT_REFERENCE_SAMPLE } from "./reference-samples.data.mjs";
import { getBundledReferenceFile } from "./reference-samples.server.mjs";

/** Matches GET /api/health in local-analysis mode (production + E2E). */
export const DEMO_HEALTH_RESPONSE = {
  ok: true,
  provider: "demo",
  hasApiKey: false,
  liveAnalysisEnabled: false,
  model: null,
  baseUrl: null,
};

/** Bundled sample used by default sample picker option and E2E. */
export const SAMPLE_REFERENCE_NAME = DEFAULT_REFERENCE_SAMPLE.fileName;

/**
 * File metadata for the bundled dashboard reference (size read from disk when omitted).
 * @param {{ size?: number; fileName?: string }} [options]
 */
export function getSampleReferenceFile({ size, fileName } = {}) {
  return getBundledReferenceFile({ size, fileName });
}

/**
 * Build a sample artifact for tests, E2E fixtures, and documentation.
 * @param {{ name: string; type?: string; size: number; width?: number | null; height?: number | null }} file
 * @param {Record<string, unknown>} [overrides]
 */
export function buildDemoArtifactForFile(file, overrides = {}) {
  return buildUiFlowArtifact(file, {
    modeLabel: "Analyzer ready",
    ...overrides,
  });
}

/** Safety-net payload when E2E analyze route is hit despite local-analysis health. */
export function buildDemoAnalyzeUiErrorResponse() {
  return {
    ok: false,
    code: "missing_qwen_api_key",
    message: "E2E mock — live Qwen disabled",
  };
}

/** Full server-shaped sample success (matches buildDemoAnalyzeResponse). */
export function buildDemoAnalyzeUiSuccessResponse(file) {
  return {
    ok: true,
    demo: true,
    artifact: buildDemoArtifactForFile(file),
    provider: { model: "demo" },
  };
}
