import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { buildUiFlowArtifact } from "./ui-flow.mjs";

/** Matches GET /api/health in demo mode (production + E2E). */
export const DEMO_HEALTH_RESPONSE = {
  ok: true,
  provider: "demo",
  hasApiKey: false,
  liveAnalysisEnabled: false,
  model: null,
  baseUrl: null,
};

/** Bundled meetup sample used by "Use sample screenshot" and E2E. */
export const SAMPLE_REFERENCE_NAME = "dashboard-reference.svg";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * File metadata for the bundled dashboard reference (size read from disk when omitted).
 * @param {{ size?: number }} [options]
 */
export function getSampleReferenceFile({ size } = {}) {
  const resolvedSize =
    size ??
    readFileSync(
      resolve(__dirname, "../../public/references/dashboard-reference.svg"),
    ).length;

  return {
    name: SAMPLE_REFERENCE_NAME,
    type: "image/svg+xml",
    size: resolvedSize,
    width: 1200,
    height: 720,
  };
}

/**
 * Build a demo artifact for tests, E2E fixtures, and documentation.
 * @param {{ name: string; type?: string; size: number; width?: number | null; height?: number | null }} file
 * @param {Record<string, unknown>} [overrides]
 */
export function buildDemoArtifactForFile(file, overrides = {}) {
  return buildUiFlowArtifact(file, {
    modeLabel: "Local demo mode",
    ...overrides,
  });
}

/** Safety-net payload when E2E analyze route is hit despite demo health. */
export function buildDemoAnalyzeUiErrorResponse() {
  return {
    ok: false,
    code: "missing_qwen_api_key",
    message: "E2E mock — live Qwen disabled",
  };
}

/** Full server-shaped demo success (matches buildDemoAnalyzeResponse). */
export function buildDemoAnalyzeUiSuccessResponse(file) {
  return {
    ok: true,
    demo: true,
    artifact: buildDemoArtifactForFile(file),
    provider: { model: "demo" },
  };
}
