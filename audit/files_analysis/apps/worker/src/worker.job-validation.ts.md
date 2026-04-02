# apps/worker/src/worker.job-validation.ts

## Purpose
- Executable source under apps. Declares exports such as CrmSyncJobPayload, agentExecutionJobSchema, hashPayload, validateLegacyTaskJob.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: @birthub/config, node:crypto, zod
- Env vars: none
- Related tests: apps/worker/src/worker.job-validation.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- No heuristic issues were triggered by the static scan.

## Risk Score
- 15/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 2946 bytes
- SHA-256: 3a5642958d75cb590a1f8637d98e62cc6f7631614056aac63ba1abe5df85602a
- Direct imports/refs: @birthub/config, node:crypto, zod
- Env vars: none
- Related tests: apps/worker/src/worker.job-validation.test.ts
