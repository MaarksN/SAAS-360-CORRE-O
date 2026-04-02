# packages/testing/src/agent-execution.factory.ts

## Purpose
- Executable source under packages. Declares exports such as InvalidMockAgentExecution, MockAgentExecution, MockExecutionStatus, createInvalidMockAgentExecution, createMockAgentExecution.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: none
- Env vars: none
- Related tests: packages/testing/src/agent-execution.factory.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- No heuristic issues were triggered by the static scan.

## Risk Score
- 15/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 1825 bytes
- SHA-256: 1a79a886db40919dcca1838e5201c7a6a0509f1fa51163283cda15c149eb2346
- Direct imports/refs: none
- Env vars: none
- Related tests: packages/testing/src/agent-execution.factory.test.ts
