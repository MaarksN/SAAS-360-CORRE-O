# packages/database/prisma/seed/workflows.ts

## Purpose
- Executable source under packages. Declares exports such as createWorkflowWithGraph, disconnectWorkflowClient.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./types.js, @prisma/client
- Env vars: none
- Related tests: packages/workflows-core/test/dag.test.ts, packages/workflows-core/test/step-types.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.

## Risk Score
- 27/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 4578 bytes
- SHA-256: f0e43aecfcbbcdc916e2a6a06190c7470e3fadb2864ec3b88411d9809111239c
- Direct imports/refs: ./types.js, @prisma/client
- Env vars: none
- Related tests: packages/workflows-core/test/dag.test.ts, packages/workflows-core/test/step-types.test.ts
