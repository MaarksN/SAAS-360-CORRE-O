# apps/api/src/audit/buffer.ts

## Purpose
- Executable source under apps. Declares exports such as enqueueAuditEvent, ensureAuditFlushLoop, flushAuditBuffer, getAuditBufferSize.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: @birthub/database
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
- Size: 981 bytes
- SHA-256: b9f32899cdded0a5493b3ecf11cc41b5863f18a17df88509bbc0b2c6af55267f
- Direct imports/refs: @birthub/database
- Env vars: none
- Related tests: none
