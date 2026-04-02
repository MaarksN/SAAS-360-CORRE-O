# apps/worker/src/jobs/quotaReset.ts

## Purpose
- Executable source under apps. Declares exports such as quotaResetJob.

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
- Size: 1507 bytes
- SHA-256: 91f70bc35b4bb0bfe844b3505d35cb4b787a17af7ae390a5c7fb6dfbe9ae1ac0
- Direct imports/refs: @birthub/database
- Env vars: none
- Related tests: none
