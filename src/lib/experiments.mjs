const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

const EXPERIMENTS = {
  headerDesignSystemCta: {
    envKey: "NEXT_PUBLIC_EXP_HEADER_DESIGN_SYSTEM_CTA",
    defaultEnabled: false,
    variants: [
      { name: "control", weight: 50 },
      { name: "with-labs-badge", weight: 50 },
    ],
  },
};

function envFlag(value, defaultValue = false) {
  if (typeof value !== "string") return defaultValue;
  return TRUE_VALUES.has(value.trim().toLowerCase());
}

function normalizeWeights(variants) {
  const validVariants = variants.filter(
    (variant) =>
      typeof variant?.name === "string" &&
      variant.name.length > 0 &&
      Number.isFinite(variant.weight) &&
      variant.weight > 0,
  );

  if (validVariants.length === 0) {
    return [{ name: "control", weight: 100 }];
  }

  const total = validVariants.reduce((sum, item) => sum + item.weight, 0);
  return validVariants.map((item) => ({
    name: item.name,
    weight: item.weight / total,
  }));
}

function stableBucket(input) {
  const value = String(input ?? "");
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash + value.charCodeAt(index)) >>> 0;
  }
  return hash / 4294967295;
}

export function createExperimentConfig(env = {}) {
  const experimentsEnabled = envFlag(env.NEXT_PUBLIC_EXPERIMENTS_ENABLED, false);
  const definitions = {};

  for (const [experimentKey, experiment] of Object.entries(EXPERIMENTS)) {
    const enabledByEnv = envFlag(env[experiment.envKey], experiment.defaultEnabled);
    definitions[experimentKey] = {
      enabled: experimentsEnabled && enabledByEnv,
      variants: normalizeWeights(experiment.variants),
    };
  }

  return {
    enabled: experimentsEnabled,
    experiments: definitions,
  };
}

export function resolveExperimentVariant(experimentKey, subjectKey, config = createExperimentConfig({})) {
  const experiment = config?.experiments?.[experimentKey];
  if (!experiment?.enabled) return "control";

  const variants = Array.isArray(experiment.variants) ? experiment.variants : [];
  if (variants.length === 0) return "control";

  const bucket = stableBucket(`${experimentKey}:${String(subjectKey ?? "anonymous")}`);
  let runningWeight = 0;
  for (const variant of variants) {
    runningWeight += variant.weight;
    if (bucket <= runningWeight) {
      return variant.name;
    }
  }

  return variants[variants.length - 1]?.name ?? "control";
}

export function listExperimentKeys() {
  return Object.keys(EXPERIMENTS);
}
