# packages/agents-core/src/tools/storage.tool.ts

## Purpose
- Executable source under packages. Declares exports such as StorageAction, StorageInput, StorageProvider, StorageResult, callStorageTool.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: none
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 50/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 1076 bytes
- SHA-256: 0350f3dea31c5729ccde3ed64e2c9b36d3f433ca0a1b8b2856d33102b817735f
- Direct imports/refs: none
- Env vars: none
- Related tests: none
