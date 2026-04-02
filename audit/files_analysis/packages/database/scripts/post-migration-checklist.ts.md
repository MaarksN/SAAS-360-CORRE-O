# packages/database/scripts/post-migration-checklist.ts

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./lib/paths.js, ./lib/process.js, @birthub/logger, node:path
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
- Size: 1106 bytes
- SHA-256: d0c0ca4335b308dad8fb46eab84e35e3905f30c76cb58a0745745c8895b17dbb
- Direct imports/refs: ./lib/paths.js, ./lib/process.js, @birthub/logger, node:path
- Env vars: none
- Related tests: none
