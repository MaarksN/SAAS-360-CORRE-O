# packages/database/src/tenant-context.ts

## Purpose
- Executable source under packages. Declares exports such as TenantContext, TenantSource, getTenantContext, requireTenantId, runWithTenantContext.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./errors/tenant-required.error.js, node:async_hooks
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
- Size: 1246 bytes
- SHA-256: e6bc87a5f86913513dc39eaee8026b09ae912626df5189e9acd93ff87df73353
- Direct imports/refs: ./errors/tenant-required.error.js, node:async_hooks
- Env vars: none
- Related tests: none
