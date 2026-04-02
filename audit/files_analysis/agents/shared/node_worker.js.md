# agents/shared/node_worker.js

## Purpose
- Executable source under agents. No explicit named exports detected.

## Architectural Role
- Agent-specific runtime or support module.

## Dependencies
- Imports/refs: axios, bullmq, ioredis
- Env vars: INTERNAL_SERVICE_TOKEN
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- console_logging: Uses console-based logging 11 time(s) in runtime code.
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- direct_env_access: Reads environment variables directly outside the shared config surface.
- queue_guardrails_missing: Queue usage appears without obvious retry/retention/backpressure controls in the same file.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 100/100

## Status
- CRITICO

## Evidence
- Kind: runtime
- Language: JavaScript
- Top level: agents
- Size: 1900 bytes
- SHA-256: 4ef9ee6cad5b4b3a73276a903e81e4ed3f5f09d88f9244f83a8c88539c25eab4
- Direct imports/refs: axios, bullmq, ioredis
- Env vars: INTERNAL_SERVICE_TOKEN
- Related tests: none
