# apps/web/lib/workflows.ts

## Purpose
- Executable source under apps. Declares exports such as WorkflowDetail, WorkflowExecutionSnapshot, getWorkflowById.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: @birthub/config, @birthub/workflows-core, next/headers
- Env vars: none
- Related tests: packages/workflows-core/test/dag.test.ts, packages/workflows-core/test/step-types.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.

## Risk Score
- 47/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 2233 bytes
- SHA-256: afba417aff5f9d1fc86630be80c94239345e58a80602fdb8553e73cc426f5402
- Direct imports/refs: @birthub/config, @birthub/workflows-core, next/headers
- Env vars: none
- Related tests: packages/workflows-core/test/dag.test.ts, packages/workflows-core/test/step-types.test.ts
