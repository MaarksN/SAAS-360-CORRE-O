# apps/worker/src/jobs/billingExportStorage.ts

## Purpose
- Executable source under apps. Declares exports such as BillingExportStorage, BillingExportUploadInput, LocalBillingExportStorage, S3BillingExportStorage, createBillingExportStorage.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: @aws-sdk/client-s3, @birthub/config, node:fs/promises, node:path
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 42/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 2172 bytes
- SHA-256: 77419441a10e97e007452f21a984bf9bc7425cdf17f6bb4ba950bd84d7d21954
- Direct imports/refs: @aws-sdk/client-s3, @birthub/config, node:fs/promises, node:path
- Env vars: none
- Related tests: none
