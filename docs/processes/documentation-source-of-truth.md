# Documentation Source Of Truth

## Canonical process map

| Processo | Documento canônico | Owner | Revisão | Referências históricas/superseded |
| --- | --- | --- | --- | --- |
| Ownership por domínio | `docs/operations/f0-ownership-matrix.md` | `@platform-devex` | trimestral | `docs/F0/ownership.md` |
| Deploy / go-live | `docs/release/2026-03-20-go-live-runbook.md` | `@platform-architecture` | a cada release | `docs/release/2026-03-16-staging-validation-runbook.md` |
| Rollback de banco | `docs/database/migration-rollback-plan.md` | `@platform-data` | a cada mudança de migração | `docs/release/rollback_v1.sql`, `docs/runbooks/db-backup-restore.md` |
| Onboarding CS | `docs/cs/cs-tool-onboarding.md` | `@cs-ops` | mensal | `docs/ux/cs_tool_onboarding.md` |
| Incident response | `docs/security/incident_response_runbook.md` | `@platform-security` | mensal | `docs/runbooks/critical-incidents.md`, `docs/runbooks/tenant-specific-incident-runbook.md`, `docs/policies/incident-communication-policy.md` |

## Archival register

### 2026-03-22

- `docs/adr/*` passa a ser tratado como alias histórico. Toda nova decisão arquitetural deve ir para `docs/adrs/*`.
- `docs/ux/cs_tool_onboarding.md` permanece apenas como referência histórica; o onboarding operacional ativo é `docs/cs/cs-tool-onboarding.md`.
- Referências operacionais a rollback devem apontar primeiro para `docs/database/migration-rollback-plan.md`; SQLs e runbooks auxiliares ficam como apêndices de execução.

## Required metadata for new docs

Todo documento novo de processo deve informar:

- owner
- status (`active`, `draft`, `archived`, `deprecated`)
- data de revisão
- documento fonte de verdade relacionado
- impacto de rollback, quando aplicável
