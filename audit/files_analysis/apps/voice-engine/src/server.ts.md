# apps/voice-engine/src/server.ts

## Purpose
- Executable source under apps. Declares exports such as VoiceEngineEnv, createVoiceEngineRuntime, readVoiceEngineEnv.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: @birthub/logger, express, node:http, redis, ws
- Env vars: BIRTHUB_DISABLE_VOICE_ENGINE_AUTOSTART, NODE_ENV
- Related tests: apps/voice-engine/src/server.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- direct_env_access: Reads environment variables directly outside the shared config surface.

## Risk Score
- 25/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 6201 bytes
- SHA-256: 1d6bd660cfaf1b41848398e211ba5c02116d12dda32fcf967001e29e3fc622f0
- Direct imports/refs: @birthub/logger, express, node:http, redis, ws
- Env vars: BIRTHUB_DISABLE_VOICE_ENGINE_AUTOSTART, NODE_ENV
- Related tests: apps/voice-engine/src/server.test.ts
