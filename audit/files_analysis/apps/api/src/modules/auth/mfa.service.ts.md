# apps/api/src/modules/auth/mfa.service.ts

## Purpose
- Executable source under apps. Declares exports such as buildOtpauthUrl, buildQrCodeDataUrl, decryptTotpSecret, encryptTotpSecret, generateCurrentTotp, +4 more.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ./crypto.js, node:crypto
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
- Top level: apps
- Size: 3759 bytes
- SHA-256: 33071e7d17e6e146ae6ad8f90420330e717d34e27679e04ab8555c2359b8863b
- Direct imports/refs: ./crypto.js, node:crypto
- Env vars: none
- Related tests: none
