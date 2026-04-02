# apps/worker/src/jobs/scheduler.ts

## Purpose
- Executable source under apps. Declares exports such as Cycle2JobsRuntime, startCycle2Jobs.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ./auditFlush.js, ./billingExport.js, ./healthScore.js, ./inviteCleanup.js, ./quotaReset.js, ./sunsetPolicy.js, @birthub/database, @birthub/logger
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
- Size: 3539 bytes
- SHA-256: 137eab6acba95c20fda7dec2defc6cb051a5844b928b02f57ffe0aca855ef340
- Direct imports/refs: ./auditFlush.js, ./billingExport.js, ./healthScore.js, ./inviteCleanup.js, ./quotaReset.js, ./sunsetPolicy.js, @birthub/database, @birthub/logger
- Env vars: none
- Related tests: none
