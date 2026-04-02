# apps/api/src/observability/sentry.ts

## Purpose
- Executable source under apps. Declares exports such as captureApiException, captureWebhookException, initializeApiSentry.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: @birthub/config, @sentry/node, express
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
- Size: 2398 bytes
- SHA-256: 9bc801a3e9e748adb2437bc57272456f2da06ebb8f00b4e2720565a9d67f8fc0
- Direct imports/refs: @birthub/config, @sentry/node, express
- Env vars: none
- Related tests: none
