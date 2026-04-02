# packages/database/prisma/schema.prisma

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: none
- Env vars: none
- Related tests: packages/agent-packs/test/manifest-schema.test.ts, packages/agents/executivos/brandguardian/tests/test_schema.ts, packages/agents/executivos/budgetfluid/tests/test_schema.ts, packages/agents/executivos/capitalallocator/tests/test_schema.ts, packages/agents/executivos/churndeflector/tests/test_schema.ts, packages/agents/executivos/competitorxray/tests/test_schema.ts, packages/agents/executivos/crisisnavigator/tests/test_schema.ts, packages/agents/executivos/culturepulse/tests/test_schema.ts

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
- Language: PRISMA
- Top level: packages
- Size: 42748 bytes
- SHA-256: 2e2f76de00fb3d40de422cae2a414bc35aaf457d69cef4314c090c9f3ba9e4c2
- Direct imports/refs: none
- Env vars: none
- Related tests: packages/agent-packs/test/manifest-schema.test.ts, packages/agents/executivos/brandguardian/tests/test_schema.ts, packages/agents/executivos/budgetfluid/tests/test_schema.ts, packages/agents/executivos/capitalallocator/tests/test_schema.ts, packages/agents/executivos/churndeflector/tests/test_schema.ts, packages/agents/executivos/competitorxray/tests/test_schema.ts, packages/agents/executivos/crisisnavigator/tests/test_schema.ts, packages/agents/executivos/culturepulse/tests/test_schema.ts
