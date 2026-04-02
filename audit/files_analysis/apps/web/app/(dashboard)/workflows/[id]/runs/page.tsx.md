# apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx

## Purpose
- Executable source under apps. No explicit named exports detected.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: @birthub/config, @birthub/workflows-core, react, reactflow
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 62/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 13086 bytes
- SHA-256: eee8be6a0c301147d5124e2a584ca187df85a01abc7b78cced1237f4c2820ac5
- Direct imports/refs: @birthub/config, @birthub/workflows-core, react, reactflow
- Env vars: none
- Related tests: none
