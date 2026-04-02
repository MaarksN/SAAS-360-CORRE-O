# Package Script Status

Generated at: 2026-03-31T04:20:09.802Z

- Workspaces: 23
- Script slots ok: 90
- Script slots N/A: 2
- Script slots missing: 0

## Approved N/A criteria

- runtime-overlay: Package only owns a tsx worker shim and relies on validated shared packages for compile-time guarantees.
- shared-source-only: Package exposes shared source-only modules consumed directly from repository code.
- template-only: Package contains runtime-loaded templates and does not publish a standalone distributable artifact.
- types-only: Package exports only types or schemas and is validated transitively by consumer typechecks.

## Package matrix

| Package | Path | Priority | Owner | Deadline | Lint | Typecheck | Test | Build | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| @birthub/agent-packs | packages/agent-packs | P2 | Platform Engineering | 2026-03-29 | ok | ok | ok | ok | - |
| @birthub/agent-runtime | packages/agent-runtime | P2 | Platform Engineering | 2026-03-29 | ok | ok | ok | ok | - |
| @birthub/agents-core | packages/agents-core | P2 | Platform Engineering | 2026-03-29 | ok | ok | ok | ok | - |
| @birthub/agents-registry | packages/agents-registry | P2 | Platform Engineering | 2026-03-29 | ok | ok | ok | ok | - |
| @birthub/api | apps/api | P2 | Platform Engineering | 2026-03-29 | ok | ok | ok | ok | - |
| @birthub/auth | packages/auth | P1 | Platform Engineering | 2026-03-29 | ok | ok | ok | ok | - |
| @birthub/config | packages/config | P2 | Platform Engineering | 2026-03-29 | ok | ok | ok | ok | - |
| @birthub/conversation-core | packages/conversation-core | P2 | Platform Engineering | 2026-03-29 | ok | ok | ok | ok | - |
| @birthub/database | packages/database | P2 | Platform Engineering | 2026-03-29 | ok | ok | ok | ok | - |
| @birthub/emails | packages/emails | P2 | Platform Engineering | 2026-03-29 | ok | ok | ok | N/A | build: Email templates are rendered in-place by consumers and do not ship a separate library build. |
| @birthub/integrations | packages/integrations | P1 | Platform Engineering | 2026-03-29 | ok | ok | ok | ok | - |
| @birthub/llm-client | packages/llm-client | P1 | Platform Engineering | 2026-03-29 | ok | ok | ok | ok | - |
| @birthub/logger | packages/logger | P2 | Platform Engineering | 2026-03-29 | ok | ok | ok | ok | - |
| @birthub/queue | packages/queue | P1 | Platform Engineering | 2026-03-29 | ok | ok | ok | ok | - |
| @birthub/security | packages/security | P1 | Platform Engineering | 2026-03-29 | ok | ok | ok | ok | - |
| @birthub/shared | packages/shared | P2 | Platform Engineering | 2026-03-29 | ok | ok | ok | N/A | build: Shared error helpers are consumed directly from source and do not require an isolated bundle. |
| @birthub/shared-types | packages/shared-types | P2 | Platform Engineering | 2026-03-29 | ok | ok | ok | ok | - |
| @birthub/testing | packages/testing | P2 | Platform Engineering | 2026-03-29 | ok | ok | ok | ok | - |
| @birthub/utils | packages/utils | P1 | Platform Engineering | 2026-03-29 | ok | ok | ok | ok | - |
| @birthub/voice-engine | apps/voice-engine | P2 | Platform Engineering | 2026-03-29 | ok | ok | ok | ok | - |
| @birthub/web | apps/web | P2 | Platform Engineering | 2026-03-29 | ok | ok | ok | ok | - |
| @birthub/worker | apps/worker | P2 | Platform Engineering | 2026-03-29 | ok | ok | ok | ok | - |
| @birthub/workflows-core | packages/workflows-core | P2 | Platform Engineering | 2026-03-29 | ok | ok | ok | ok | - |

## Governance

Reference process: `docs/standards/package-script-governance.md`.

