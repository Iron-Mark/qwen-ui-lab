export type UploadFlowStage = "empty" | "uploaded" | "analyzed" | "generated";
export type UploadProviderState = "idle" | "loading" | "qwen" | "fallback" | "error";

export function getCurrentFlowStepIndex(
  stage: UploadFlowStage,
  providerState: UploadProviderState,
) {
  if (providerState === "loading") return 1;
  if (stage === "empty" || stage === "uploaded") return 0;
  if (stage === "analyzed") return 2;
  return 5;
}

export function shouldShowWorkflowOutput({
  hasArtifact,
  hasFile,
  providerState,
}: {
  hasArtifact: boolean;
  hasFile: boolean;
  providerState: UploadProviderState;
}) {
  return hasFile || hasArtifact || providerState === "loading";
}
