# packages/agents/executivos/brandguardian/tools.ts

## Purpose
- Executable source under packages. Declares exports such as BRANDGUARDIAN_TOOL_IDS, BrandGuardianToolAdapters, BrandSentimentSnapshot, BrandSentimentSnapshotSchema, BrandToolId, +8 more.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./schemas.js, node:crypto, zod
- Env vars: none
- Related tests: agents/account_manager/tests/test_tools.py, agents/ae/tests/test_ae_tools.py, agents/analista/tests/test_tools.py, agents/closer/tests/test_tools.py, agents/coordenador_comercial/tests/test_tools.py, agents/executivo_negocios/tests/test_tools.py, agents/financeiro/tests/test_tools.py, agents/gerente_comercial/tests/test_tools.py

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
- Size: 4931 bytes
- SHA-256: 1f1ee5c30cf37b237be35db0b076180eb51c825dd5ace1f7821355befbe73e08
- Direct imports/refs: ./schemas.js, node:crypto, zod
- Env vars: none
- Related tests: agents/account_manager/tests/test_tools.py, agents/ae/tests/test_ae_tools.py, agents/analista/tests/test_tools.py, agents/closer/tests/test_tools.py, agents/coordenador_comercial/tests/test_tools.py, agents/executivo_negocios/tests/test_tools.py, agents/financeiro/tests/test_tools.py, agents/gerente_comercial/tests/test_tools.py
