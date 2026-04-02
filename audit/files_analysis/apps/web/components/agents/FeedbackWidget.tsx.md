# apps/web/components/agents/FeedbackWidget.tsx

## Purpose
- Executable source under apps. Declares exports such as FeedbackWidget.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: ../../lib/auth-client, ../../providers/AnalyticsProvider, lucide-react, react
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
- Size: 7196 bytes
- SHA-256: 98db7a1e63313c739acdf2190db8de5fadd5360e3207f962b50601fbd2678600
- Direct imports/refs: ../../lib/auth-client, ../../providers/AnalyticsProvider, lucide-react, react
- Env vars: none
- Related tests: none
