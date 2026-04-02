# packages/agents-core/src/tools/baseTool.ts

## Purpose
- Executable source under packages. Declares exports such as BaseToolOptions, ToolCostMetadata, ToolDefinition, ToolExecutionContext.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ../policy/engine.js, zod
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 30/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 2758 bytes
- SHA-256: 79b3cd4f68bc372e45741918792c0ccb29a8e4e6e1a120e11be466df66e3e352
- Direct imports/refs: ../policy/engine.js, zod
- Env vars: none
- Related tests: none
