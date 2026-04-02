# apps/api/src/modules/agents/service.repository.ts

## Purpose
- Executable source under apps. Declares exports such as findReusableRunningExecution, resolveInstalledAgent, resolveOrganization.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../lib/problem-details.js, ../marketplace/marketplace-service.js, ./service.config.js, ./service.snapshot.js, ./service.types.js, @birthub/database
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
- Size: 3352 bytes
- SHA-256: 7a34c6fff91f42eb19b0df6bcc9202b3495d5c87ed17381c8c2f3fdfd1406685
- Direct imports/refs: ../../lib/problem-details.js, ../marketplace/marketplace-service.js, ./service.config.js, ./service.snapshot.js, ./service.types.js, @birthub/database
- Env vars: none
- Related tests: none
