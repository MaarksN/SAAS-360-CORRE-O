# packages/agents-core/src/execution/dry-run.ts

## Purpose
- Executable source under packages. Declares exports such as DryRunResult, computeOutputHash, runAgentDryRun.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ../manifest/schema.js, node:crypto
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
- Top level: packages
- Size: 854 bytes
- SHA-256: 1b00f486372e52c3b72d6d60ee40c8c2d750b436e53067af78d6a8dac44ddd64
- Direct imports/refs: ../manifest/schema.js, node:crypto
- Env vars: none
- Related tests: none
