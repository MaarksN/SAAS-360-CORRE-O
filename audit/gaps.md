# Gap Analysis

## database-proof-environment
- type: partial
- impact: High: cross-tenant controls cannot be fully re-proven without a provisioned PostgreSQL target.
- priority: P0
- blocking_effect: Tenant-isolation proof is not guaranteed in every local audit run.
- recommended_fix: Provision PostgreSQL for audit runs and fail the audit lane when packages/database tests report skips.

## runtime-any-surfaces
- type: unsafe
- impact: Medium: 41 runtime file(s) still expose 'any'.
- priority: P1
- blocking_effect: Static guarantees degrade at shared/runtime boundaries.
- recommended_fix: Refactor shared contracts and runtime entrypoints to replace 'any' with explicit schemas or discriminated unions.

## legacy-console-logging
- type: partial
- impact: Medium: 91 runtime file(s) still use console logging.
- priority: P1
- blocking_effect: Operational logs remain inconsistent across runtime surfaces.
- recommended_fix: Migrate remaining runtime files to @birthub/logger so logs, trace context and redaction stay uniform.

## timeout-light-integrations
- type: unsafe
- impact: High: 74 runtime file(s) show outbound network access without explicit timeout hints.
- priority: P1
- blocking_effect: Outbound integrations can hang or fail without bounded latency.
- recommended_fix: Add explicit request timeout and retry policy to remaining agent/runtime HTTP clients.
