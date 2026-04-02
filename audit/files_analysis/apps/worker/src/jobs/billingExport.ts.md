# apps/worker/src/jobs/billingExport.ts

## Purpose
- Executable source under apps. Declares exports such as exportDailyBillingInvoices, resolveBillingExportWindow.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ./billingExportStorage.js, @birthub/config, @birthub/database
- Env vars: none
- Related tests: apps/worker/src/jobs/billingExport.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.

## Risk Score
- 27/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 3998 bytes
- SHA-256: f5cbe03b720caac14e811af9d6b0bdad044da7781c637f294ef7a889d646a7e1
- Direct imports/refs: ./billingExportStorage.js, @birthub/config, @birthub/database
- Env vars: none
- Related tests: apps/worker/src/jobs/billingExport.test.ts
