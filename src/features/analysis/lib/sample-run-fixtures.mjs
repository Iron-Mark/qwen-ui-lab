import { buildUiFlowArtifact } from "./ui-flow.mjs";
import { DEFAULT_SAMPLE_RUN } from "./reference-samples.data.mjs";
import { getSampleRunFileMetadata } from "./reference-samples.server.mjs";

/** Matches GET /api/health in local-analysis mode (production + E2E). */
export const LOCAL_ANALYSIS_HEALTH_RESPONSE = {
  ok: true,
  provider: "demo",
  hasApiKey: false,
  liveAnalysisEnabled: false,
  model: null,
  baseUrl: null,
};

/** Sample run file used by default sample picker option and E2E. */
export const SAMPLE_RUN_FILE_NAME = DEFAULT_SAMPLE_RUN.fileName;

/**
 * File metadata for the dashboard sample run (size read from disk when omitted).
 * @param {{ size?: number; fileName?: string }} [options]
 */
export function getSampleRunFile({ size, fileName } = {}) {
  return getSampleRunFileMetadata({ size, fileName });
}

/**
 * Build a sample artifact for tests, E2E fixtures, and documentation.
 * @param {{ name: string; type?: string; size: number; width?: number | null; height?: number | null }} file
 * @param {Record<string, unknown>} [overrides]
 */
export function buildSampleRunArtifactForFile(file, overrides = {}) {
  return buildUiFlowArtifact(file, {
    modeLabel: "Ready to analyze",
    ...overrides,
  });
}

/** Safety-net payload when E2E analyze route is hit despite local-analysis health. */
export function buildLocalAnalyzeUiErrorResponse() {
  return {
    ok: false,
    code: "missing_qwen_api_key",
    message: "Local preview is configured for this environment.",
  };
}

/** Full server-shaped sample success (matches the local analyze response). */
export function buildSampleRunAnalyzeUiSuccessResponse(file) {
  return {
    ok: true,
    sampleRun: true,
    demo: true,
    artifact: buildSampleRunArtifactForFile(file),
    provider: { model: "demo" },
  };
}
