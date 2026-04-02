# scripts/security/check-auth-guards.ts

## Purpose
- Executable source under scripts. Declares exports such as scanAuthGuards.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: node:fs, node:path, node:url, typescript
- Env vars: none
- Related tests: scripts/security/check-auth-guards.test.ts

## Operational Relevance
- Included in the SaaS score.

## Problems
- console_logging: Uses console-based logging 3 time(s) in runtime code.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.

## Risk Score
- 42/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: scripts
- Size: 10965 bytes
- SHA-256: 1e7af67150abaf7600fcf2bf446f4914a082cab483dfaaba878684233d329073
- Direct imports/refs: node:fs, node:path, node:url, typescript
- Env vars: none
- Related tests: scripts/security/check-auth-guards.test.ts
