export type ProviderMode = "unknown" | "live" | "demo";

export type ProviderModeLike = ProviderMode | "qwen";

export function getProviderModeLabel(mode: ProviderModeLike | null | undefined) {
  if (mode === "live" || mode === "qwen") return "Live Qwen";
  if (mode === "demo") return "Local analysis";
  return "Checking";
}
