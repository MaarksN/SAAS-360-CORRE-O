# packages/integrations/src/clients/llm.ts

## Purpose
- Executable source under packages. Declares exports such as AnthropicClient, CompletionOptions, CompletionResponse, GeminiClient, ILLMClient, +2 more.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./http
- Env vars: none
- Related tests: packages/llm-client/src/index.test.ts

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
- Top level: packages
- Size: 7217 bytes
- SHA-256: 542417864317e51a0a9090f3a07fd85c121decda29477e8084f8624c3936c77b
- Direct imports/refs: ./http
- Env vars: none
- Related tests: packages/llm-client/src/index.test.ts
