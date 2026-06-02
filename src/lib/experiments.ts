type EnvInput = Record<string, string | undefined>;

export interface ExperimentVariantWeight {
  name: string;
  weight: number;
}

export interface ExperimentDefinition {
  enabled: boolean;
  variants: ExperimentVariantWeight[];
}

export interface ExperimentConfig {
  enabled: boolean;
  experiments: Record<string, ExperimentDefinition>;
}

// Reuse runtime implementation shared with node tests.
import * as runtime from "./experiments.mjs";

const runtimeModule = runtime as unknown as {
  createExperimentConfig: (env?: EnvInput) => ExperimentConfig;
  resolveExperimentVariant: (
    experimentKey: string,
    subjectKey: string,
    config?: ExperimentConfig,
  ) => string;
  listExperimentKeys: () => string[];
};

export const createExperimentConfig = runtimeModule.createExperimentConfig;
export const resolveExperimentVariant = runtimeModule.resolveExperimentVariant;
export const listExperimentKeys = runtimeModule.listExperimentKeys;
