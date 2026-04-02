# packages/workflows-core/src/errors.ts

## Purpose
- Executable source under packages. Declares exports such as CyclicDependencyError, InvalidGraphError, InvalidStepConfigError.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: none
- Env vars: none
- Related tests: packages/shared/errors/index.test.ts

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
- Size: 599 bytes
- SHA-256: 0c80b592fbf6eabdbef0752ae7296533f2a869c8efb966caf479e7af98ec8779
- Direct imports/refs: none
- Env vars: none
- Related tests: packages/shared/errors/index.test.ts
