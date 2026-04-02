# packages/llm-client/src/index.ts

## Purpose
- Executable source under packages. Declares exports such as LLMClient, LLMConfig, LLMProvider.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: @birthub/integrations, @birthub/utils
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- any_usage: Contains 2 occurrence(s) of 'any'.

## Risk Score
- 21/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 2819 bytes
- SHA-256: c863e561b29d8dcd2e383f0f76209be2121b852b95eb40d0f26877d8ff8032d3
- Direct imports/refs: @birthub/integrations, @birthub/utils
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts
