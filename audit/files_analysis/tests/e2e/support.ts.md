# tests/e2e/support.ts

## Purpose
- Executable source under tests. Declares exports such as bootstrapSession, mockDemoWorkflowRuns, mockEvidenceWorkflowEditor, mockExecutionFeedback.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: @playwright/test
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

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
- Top level: tests
- Size: 7251 bytes
- SHA-256: ac472f1fa9dda3137e4ce29b461e200389ac14b0a93376d1d56c2dc68b8dc087
- Direct imports/refs: @playwright/test
- Env vars: none
- Related tests: none
