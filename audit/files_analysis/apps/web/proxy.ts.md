# apps/web/proxy.ts

## Purpose
- Executable source under apps. Declares exports such as config, proxy.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: next/server
- Env vars: NODE_ENV
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- direct_env_access: Reads environment variables directly outside the shared config surface.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 40/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 765 bytes
- SHA-256: 0cd41a0022e2874c0ec619e7f061bb3a10b52548b8a57b68210d47bf33bd924e
- Direct imports/refs: next/server
- Env vars: NODE_ENV
- Related tests: none
