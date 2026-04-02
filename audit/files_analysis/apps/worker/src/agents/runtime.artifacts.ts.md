# apps/worker/src/agents/runtime.artifacts.ts

## Purpose
- Executable source under apps. Declares exports such as buildLearningRecord, createOutputArtifact.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ./runtime.shared.js, @birthub/agents-core, @birthub/database, node:crypto
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 42/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 2022 bytes
- SHA-256: 9d6e7e45e9fa38319a7e33acb9681dc0b7dabd2e294ba7490f94bddc57c7207a
- Direct imports/refs: ./runtime.shared.js, @birthub/agents-core, @birthub/database, node:crypto
- Env vars: none
- Related tests: none
