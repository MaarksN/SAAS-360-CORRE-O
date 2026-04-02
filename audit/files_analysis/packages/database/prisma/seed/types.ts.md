# packages/database/prisma/seed/types.ts

## Purpose
- Executable source under packages. Declares exports such as PlanSeed, SeedWorkflowDefinition, SeedWorkflowStep, SeedWorkflowTransition, SeededPlanMap, +1 more.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: @prisma/client
- Env vars: none
- Related tests: packages/shared-types/src/index.test.ts, packages/workflows-core/test/step-types.test.ts

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
- Top level: packages
- Size: 1242 bytes
- SHA-256: b0c3c65d73a9a6660c9c457b1bcab55187eb4e5059afcb3f063b43b2ed62f6a2
- Direct imports/refs: @prisma/client
- Env vars: none
- Related tests: packages/shared-types/src/index.test.ts, packages/workflows-core/test/step-types.test.ts
