# packages/workflows-core/src/types.ts

## Purpose
- Executable source under packages. Declares exports such as DagEdge, DagNode, DagRoute, DagValidationInput, DagValidationOptions, +3 more.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: none
- Env vars: none
- Related tests: packages/shared-types/src/index.test.ts, packages/workflows-core/test/step-types.test.ts

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
- Top level: packages
- Size: 1242 bytes
- SHA-256: 3c84bbd54310a9c37c963bba30fc95dce21516f0dda1ca3a6c168a9375d53bf2
- Direct imports/refs: none
- Env vars: none
- Related tests: packages/shared-types/src/index.test.ts, packages/workflows-core/test/step-types.test.ts
