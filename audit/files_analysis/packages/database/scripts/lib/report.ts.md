# packages/database/scripts/lib/report.ts

## Purpose
- Executable source under packages. Declares exports such as writeJsonReport, writeTextReport.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./paths.js, node:fs/promises, node:path
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
- Size: 735 bytes
- SHA-256: fe6544aa3216138c841337e484e6c8651e04f1eb18ebf15aad83a62bd35686c9
- Direct imports/refs: ./paths.js, node:fs/promises, node:path
- Env vars: none
- Related tests: none
