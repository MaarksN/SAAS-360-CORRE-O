# apps/web/app/(dashboard)/marketplace/page.tsx

## Purpose
- Executable source under apps. No explicit named exports detected.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: ../../../components/wizards/PackInstaller, ../../../lib/marketplace-api.server, @birthub/config, next/link
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
- Size: 8878 bytes
- SHA-256: 9a49f2b099746c8c7f492270c5a6e64c631a4bae2be7392929822a0869dc371c
- Direct imports/refs: ../../../components/wizards/PackInstaller, ../../../lib/marketplace-api.server, @birthub/config, next/link
- Env vars: none
- Related tests: none
