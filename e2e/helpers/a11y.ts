import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Run axe and fail only on critical-impact violations. */
export async function expectNoCriticalA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const critical = results.violations.filter((v) => v.impact === "critical");

  if (critical.length > 0) {
    const summary = critical
      .map(
        (v) =>
          `[${v.id}] ${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? "" : "s"})`,
      )
      .join("\n");
    expect(critical, `Critical a11y violations:\n${summary}`).toHaveLength(0);
  }
}
