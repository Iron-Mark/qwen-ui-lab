import { buildProductionReadiness } from "./production-readiness.mjs";

export function handleReadinessGet(env = process.env) {
  return Response.json(buildProductionReadiness(env));
}
