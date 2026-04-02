# apps/web/components/agents/agent-run-panel.tsx

## Purpose
- Executable source under apps. Declares exports such as AgentRunPanel.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: ../../providers/AnalyticsProvider, ./FeedbackWidget, react
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
- Size: 5962 bytes
- SHA-256: 45f81cc223e1c137a100adb1f6c2bd3f2989357b697f4089cbb3b2c9c5e79d19
- Direct imports/refs: ../../providers/AnalyticsProvider, ./FeedbackWidget, react
- Env vars: none
- Related tests: none
