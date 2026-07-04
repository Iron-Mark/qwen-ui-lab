import { buildUiFlowArtifact } from "./ui-flow.mjs";

/** CI-safe placeholders - never use real DashScope credentials in tests. */
export const MOCK_QWEN_MODEL = "qwen3-vl-plus-mock";
export const MOCK_QWEN_BASE_URL = "https://mock.qwen.ci/v1";
export const MOCK_CI_API_KEY = "ci-mock-key-not-real";

/** Deterministic analysis JSON returned inside Qwen chat/completions content. */
export const MOCK_QWEN_ANALYSIS_JSON = {
  summary: "Contract test dashboard shell from contract upstream.",
  plan: [
    {
      title: "Contract Layout Read",
      body: "Header row and stat grid from contract upstream.",
    },
    {
      title: "Contract Component Map",
      body: "Cards, chart, and activity regions from contract upstream.",
    },
  ],
  generatedCode:
    [
      "export default function ContractDashboardStarter() {",
      "  return (",
      '    <main data-contract-test aria-label="Contract dashboard starter">',
      '      <section className="grid gap-4 md:grid-cols-3">',
      '        <article className="rounded-lg border p-4">Contract metric</article>',
      '        <article className="rounded-lg border p-4">Contract chart</article>',
      '        <article className="rounded-lg border p-4">Contract activity</article>',
      "      </section>",
      "    </main>",
      "  );",
      "}",
    ].join("\n"),
  previewStats: [
    { label: "Contract Sections", value: "5" },
    { label: "Contract Components", value: "9" },
  ],
};

/** GET /api/health shape when live analysis is enabled (E2E route mock). */
export const LIVE_QWEN_HEALTH_RESPONSE = {
  ok: true,
  provider: "qwen",
  hasApiKey: true,
  liveAnalysisEnabled: true,
  model: MOCK_QWEN_MODEL,
  baseUrl: MOCK_QWEN_BASE_URL,
};

/**
 * OpenAI-compatible chat/completions payload for fetchFn or upstream stubs.
 * @param {typeof MOCK_QWEN_ANALYSIS_JSON} [analysis]
 */
export function buildMockQwenChatCompletionResponse(
  analysis = MOCK_QWEN_ANALYSIS_JSON,
) {
  return {
    model: MOCK_QWEN_MODEL,
    choices: [
      {
        message: {
          content: JSON.stringify(analysis),
        },
      },
    ],
  };
}

/**
 * POST /api/analyze-ui success shape after upstream mock returns valid JSON.
 * @param {{ name: string; type?: string; size: number; width?: number | null; height?: number | null }} file
 */
export function buildMockLiveAnalyzeUiRouteResponse(file) {
  return {
    ok: true,
    artifact: buildUiFlowArtifact(file, {
      plan: MOCK_QWEN_ANALYSIS_JSON.plan,
      generatedCode: MOCK_QWEN_ANALYSIS_JSON.generatedCode,
      previewStats: MOCK_QWEN_ANALYSIS_JSON.previewStats,
      modeLabel: "Ready for review",
      summary: MOCK_QWEN_ANALYSIS_JSON.summary,
    }),
    provider: {
      model: MOCK_QWEN_MODEL,
      baseUrl: MOCK_QWEN_BASE_URL,
    },
  };
}

/** Env object for unit tests that exercise the live path without real credentials. */
export function buildMockLiveQwenEnv(overrides = {}) {
  return {
    DASHSCOPE_API_KEY: MOCK_CI_API_KEY,
    QWEN_LIVE_ANALYSIS: "true",
    QWEN_BASE_URL: MOCK_QWEN_BASE_URL,
    QWEN_MODEL: MOCK_QWEN_MODEL,
    ...overrides,
  };
}
