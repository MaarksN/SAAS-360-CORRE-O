# apps/api/src/modules/agents/service.policy.ts

## Purpose
- Executable source under apps. Declares exports such as buildTemplatePolicies, persistManagedPolicies.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../lib/prisma-json.js, ./service.config.js, ./service.types.js, @birthub/agents-core, @birthub/database
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
- Size: 1759 bytes
- SHA-256: ec1ce011af22fd1dadd4134510bbe1fae26b478df76caf02e81a879eae5d161d
- Direct imports/refs: ../../lib/prisma-json.js, ./service.config.js, ./service.types.js, @birthub/agents-core, @birthub/database
- Env vars: none
- Related tests: none
