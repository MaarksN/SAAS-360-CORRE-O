# Execution Checklist

- [ ] P0 database-proof-environment: Provision PostgreSQL for audit runs and fail the audit lane when packages/database tests report skips.
- [ ] P1 runtime-any-surfaces: Refactor shared contracts and runtime entrypoints to replace 'any' with explicit schemas or discriminated unions.
- [ ] P1 legacy-console-logging: Migrate remaining runtime files to @birthub/logger so logs, trace context and redaction stay uniform.
- [ ] P1 timeout-light-integrations: Add explicit request timeout and retry policy to remaining agent/runtime HTTP clients.
