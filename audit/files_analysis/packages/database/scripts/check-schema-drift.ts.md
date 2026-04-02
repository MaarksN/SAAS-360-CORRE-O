# packages/database/scripts/check-schema-drift.ts

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./lib/paths.js, ./lib/process.js, ./lib/report.js, @birthub/logger
- Env vars: DATABASE_URL, SHADOW_DATABASE_URL
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- direct_env_access: Reads environment variables directly outside the shared config surface.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 40/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 1869 bytes
- SHA-256: a6715667d61435fc4cc5282058b053ae89a7f3f92780d2629fcdcfcb4c382a3b
- Direct imports/refs: ./lib/paths.js, ./lib/process.js, ./lib/report.js, @birthub/logger
- Env vars: DATABASE_URL, SHADOW_DATABASE_URL
- Related tests: none
