# apps/api/src/modules/privacy/service.ts

## Purpose
- Executable source under apps. Declares exports such as PRIVACY_DELETE_CONFIRMATION, deleteAccountAndPersonalData, exportTenantData, recordTenantDataExport.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../lib/problem-details.js, ../auth/auth.service.js, ../auth/crypto.js, ../billing/service.js, @birthub/config, @birthub/database
- Env vars: none
- Related tests: apps/api/tests/metrics.service.test.ts, packages/conversation-core/src/__tests__/service.test.ts

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
- Top level: apps
- Size: 9661 bytes
- SHA-256: e9f85f4776b92616603805c7cf2fb5faab5575c2c7273e73610c0387f653ef72
- Direct imports/refs: ../../lib/problem-details.js, ../auth/auth.service.js, ../auth/crypto.js, ../billing/service.js, @birthub/config, @birthub/database
- Env vars: none
- Related tests: apps/api/tests/metrics.service.test.ts, packages/conversation-core/src/__tests__/service.test.ts
