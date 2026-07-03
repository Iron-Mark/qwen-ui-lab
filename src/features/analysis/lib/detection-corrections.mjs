const CORRECTION_REASON_CODES = new Set([
  "manual-correction",
  "manual-exclusion",
  "correction-confidence",
]);

export function correctedDetectionConfidence(confidence, included) {
  const base =
    typeof confidence === "number" && Number.isFinite(confidence)
      ? confidence
      : 0.5;
  if (!included) return clampConfidence(Math.min(base, 0.38));
  return clampConfidence(Math.max(0.72, Math.min(0.97, base + 0.08)));
}

export function mergeManualCorrectionReasons({
  reasons,
  included,
  confidence,
  changes = /** @type {string[]} */ ([]),
  source = "editor",
}) {
  const existing = (Array.isArray(reasons) ? reasons : []).filter(
    (reason) => !CORRECTION_REASON_CODES.has(reasonCode(reason)),
  );

  const sourceText =
    source === "regeneration"
      ? "the next rebuild"
      : "rebuild and export";
  const correctionReasons = [
    {
      code: "manual-correction",
      label: "Box update",
      evidence: changes.length
        ? `Updated ${changes.join(", ")}; this box now guides ${sourceText}.`
        : `This updated box now guides ${sourceText}.`,
      weight: 0.96,
    },
    {
      code: "correction-confidence",
      label: "Review confidence",
      evidence: `Confidence recomputed to ${Math.round(confidence * 100)}% after the box update.`,
      weight: 0.82,
    },
  ];

  if (!included) {
    correctionReasons.splice(1, 0, {
      code: "manual-exclusion",
      label: "Hidden from starter",
      evidence:
        source === "regeneration"
          ? "The reviewer hid this detection, so it stays out of starter sections."
          : "This box stays hidden from starter sections until included again.",
      weight: 0.98,
    });
  }

  return [...correctionReasons, ...existing];
}

export function describeManualDetectionChanges(element, patch = {}) {
  const changes = [];
  if (patch.kind && patch.kind !== element?.kind) changes.push("type");
  if (patch.primitive && patch.primitive !== element?.primitive) changes.push("primitive");
  if (patch.componentRole && patch.componentRole !== element?.componentRole) {
    changes.push("role");
  }
  if (patch.included !== undefined && patch.included !== (element?.included ?? true)) {
    changes.push("inclusion");
  }
  if (
    patch.box &&
    element?.box &&
    (patch.box.x !== element.box.x ||
      patch.box.y !== element.box.y ||
      patch.box.width !== element.box.width ||
      patch.box.height !== element.box.height)
  ) {
    changes.push("geometry");
  }
  return changes;
}

export function summarizeCorrectedElementChanges(element) {
  const changes = [];
  if (element?.kind) changes.push("type");
  if (element?.primitive) changes.push("primitive");
  if (element?.componentRole) changes.push("role");
  if (element?.box) changes.push("geometry");
  if (element?.included === false) changes.push("inclusion");
  return [...new Set(changes)].slice(0, 5);
}

function reasonCode(reason) {
  return typeof reason === "string" ? reason : reason?.code;
}

function clampConfidence(value) {
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(0.99, value));
}
