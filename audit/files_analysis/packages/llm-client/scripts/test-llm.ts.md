# packages/llm-client/scripts/test-llm.ts

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ../src/index
- Env vars: GEMINI_API_KEY
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- console_logging: Uses console-based logging 4 time(s) in runtime code.
- direct_env_access: Reads environment variables directly outside the shared config surface.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 60/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 549 bytes
- SHA-256: 37ebeb2aca73a7022a24fa1455b6c55e155a9d08eae4200e230dfe861268afe3
- Direct imports/refs: ../src/index
- Env vars: GEMINI_API_KEY
- Related tests: none
