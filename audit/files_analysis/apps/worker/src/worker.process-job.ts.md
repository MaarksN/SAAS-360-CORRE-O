# apps/worker/src/worker.process-job.ts

## Purpose
- Executable source under apps. Declares exports such as createJobProcessor, resolveOrganizationReference.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ./agents/runtime.js, ./notifications/emailQueue.js, ./tenant-execution.js, ./webhooks/outbound.js, ./worker.execution-state.js, ./worker.job-validation.js, ./worker.notifications.js, @birthub/config, +4 more
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 30/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 9874 bytes
- SHA-256: c7bb3bca4cd74d96ad7f4217785b179b1fdd71a3f98678bba43bb9ce0a5fb54f
- Direct imports/refs: ./agents/runtime.js, ./notifications/emailQueue.js, ./tenant-execution.js, ./webhooks/outbound.js, ./worker.execution-state.js, ./worker.job-validation.js, ./worker.notifications.js, @birthub/config, +4 more
- Env vars: none
- Related tests: none
