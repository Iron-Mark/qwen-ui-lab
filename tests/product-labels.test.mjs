import assert from "node:assert/strict";
import test from "node:test";

import { normalizeReviewStatusLabel } from "../src/lib/product-labels.mjs";

test("normalizeReviewStatusLabel converts internal status labels to product copy", () => {
  [
    "Qwen provider: qwen3-vl-plus",
    "Local demo mode",
    "Meetup-ready",
    "Local-first preview",
    "production-ready bundle",
    "Production bundle",
    "Starter package",
    "Export package",
    "Project handoff",
    "Package copy",
    "Bundle copy",
    "Files Changes Bundle copy",
    "Handoff bundle",
    "Qwen route ready",
    "Export to repo",
    "Download package",
    "Download component",
    "Download detections",
    "Download JSON",
    "Copy all",
    "Generated preview",
    "Generated result",
    "Generated scaffold",
    "Generated scaffolds",
    "Generated UI components",
    "Generated output",
    "Full generated sample",
    "Component generation",
    "Finished-screen generator",
  ].forEach((label) => {
    assert.equal(normalizeReviewStatusLabel(label), "Analysis summary", label);
  });
  assert.equal(normalizeReviewStatusLabel("Ready to analyze"), "Ready for review");
  assert.equal(normalizeReviewStatusLabel("Local analysis"), "Local analysis");
  assert.equal(normalizeReviewStatusLabel("Sample run"), "Sample run");
  assert.equal(normalizeReviewStatusLabel("Responsive dashboard"), "Responsive dashboard");
});

test("normalizeReviewStatusLabel supports bounded custom labels", () => {
  assert.equal(
    normalizeReviewStatusLabel("", { fallback: "Shared result" }),
    "Shared result",
  );
  assert.equal(
    normalizeReviewStatusLabel("Ready to analyze", { ready: "Review ready" }),
    "Review ready",
  );
  assert.equal(normalizeReviewStatusLabel("A long custom label", { maxLength: 10 }), "A long cus");
});
