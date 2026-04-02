export {
  annotateTenantSpan,
  flagTenantForFullSampling,
  shouldForceTenantSampling
} from "./observability/otel.js";

export function startTracing(_serviceName: string): void {
  // Legacy shim: API startup now initializes OpenTelemetry from server.ts.
}
