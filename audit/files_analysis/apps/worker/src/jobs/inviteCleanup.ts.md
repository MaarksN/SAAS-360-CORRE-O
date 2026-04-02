# apps/worker/src/jobs/inviteCleanup.ts

## Purpose
- Executable source under apps. Declares exports such as inviteCleanupJob.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: @birthub/database
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
- Size: 201 bytes
- SHA-256: 598611b15fcffd534651a35a9599a992f94d5d590f9959e7b1239f962a90e470
- Direct imports/refs: @birthub/database
- Env vars: none
- Related tests: none
