# packages/database/scripts/lib/repo-scan.ts

## Purpose
- Executable source under packages. Declares exports such as RepoTextFile, collectRepoTextFiles.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: node:fs/promises, node:path
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
- Size: 1283 bytes
- SHA-256: b8276cf36448a1454d13cd6c303cabc2ac6c234572b0e7754c8b22c85a8125bf
- Direct imports/refs: node:fs/promises, node:path
- Env vars: none
- Related tests: none
