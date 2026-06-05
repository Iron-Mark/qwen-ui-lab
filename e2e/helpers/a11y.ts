import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] as const;
const FAILING_IMPACTS = new Set(["critical", "serious"]);

function formatViolationSummary(
  violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"],
) {
  return violations
    .map(
      (v) =>
        `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? "" : "s"})`,
    )
    .join("\n");
}

/** Run axe and fail on critical- or serious-impact violations. */
export async function expectNoSeriousA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags([...AXE_TAGS]).analyze();

  const failing = results.violations.filter((v) =>
    FAILING_IMPACTS.has(v.impact ?? ""),
  );

  if (failing.length > 0) {
    expect(
      failing,
      `Critical/serious a11y violations:\n${formatViolationSummary(failing)}`,
    ).toHaveLength(0);
  }
}

/** @deprecated Use expectNoSeriousA11yViolations — kept for gradual migration. */
export const expectNoCriticalA11yViolations = expectNoSeriousA11yViolations;
