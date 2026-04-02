# packages/workflows-core/src/nodes/code.ts

## Purpose
- Executable source under packages. Declares exports such as executeCodeNode.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ../types.js, node:vm
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
- Size: 1162 bytes
- SHA-256: 87b73f60ebcba4944d5cb7061a4ed812a060630b9229ffbc18cb9e225923dccd
- Direct imports/refs: ../types.js, node:vm
- Env vars: none
- Related tests: none
