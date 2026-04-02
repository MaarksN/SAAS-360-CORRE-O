# F3 — Modularização de hotspots críticos (kickoff 2026-03-21)

## Status da fase

- **Fase:** F3
- **Estado:** **EM EXECUÇÃO**
- **Pré-requisito validado:** F2 concluída com quarentena legada fechada.
- **Regra aplicada:** execução por prioridade P0 → P1 → P2, sem refactor big-bang.

## Limites formais da fase (governança técnica)

- PR de refactor com diff > 400 linhas requer justificativa explícita.
- Qualquer alteração de fronteira entre módulos exige ADR.
- Cada extração deve manter cobertura e regressão verde no escopo tocado.

## Baseline dos hotspots (line count atual)

Fonte: `artifacts/f3-hotspots-2026-03-21/hotspot-scan.txt`

| Prioridade | Arquivo | Linhas | Status inicial |
| --- | --- | ---: | --- |
| P0 | `apps/api/src/modules/billing/service.ts` | 4 | já modularizado (split concluído) |
| P0 | `apps/api/src/modules/auth/auth.service.ts` | 1116 | em execução (sessão + credenciais/MFA concluídas) |
| P0 | `apps/worker/src/agents/runtime.ts` | 989 | pendente |
| P1 | `apps/api/src/modules/agents/service.ts` | 850 | pendente |
| P1 | `apps/worker/src/worker.ts` | 822 | pendente |
| P1 | `packages/agents/executivos/narrativeweaver/agent.ts` | 806 | pendente |
| P2 | `packages/database/prisma/seed.ts` | 760 | pendente |
| P2 | `apps/api/src/app.ts` | 575 | pendente |
| P2 | `apps/worker/src/engine/runner.ts` | 530 | pendente |
| P2 | `apps/api/src/modules/analytics/service.ts` | 500 | pendente |

## Próxima sequência obrigatória

1. Iniciar extração de `auth.service.ts` (sessão, credenciais, MFA, políticas) em PRs incrementais.
2. Executar regressão de API a cada extração (`pnpm --filter @birthub/api test` e `typecheck`).
3. Registrar ADR se houver mudança de contrato entre módulos de auth.

## Template de fechamento (Anexo B)

- [ ] ITEM-ID: F3-P0-AUTH-SPLIT
  - Owner: Platform API
  - Severidade: P0
  - Prazo: 2026-03-24
  - Evidência: `apps/api/src/modules/auth/auth.service.sessions.ts`, `apps/api/src/modules/auth/auth.service.credentials.ts`, `artifacts/f3-auth-split-2026-03-21/logs/01-api-typecheck.log`, `artifacts/f3-auth-split-2026-03-21/logs/02-api-test.log`, `artifacts/f3-auth-split-2026-03-21/logs/03-api-typecheck-credentials.log`, `artifacts/f3-auth-split-2026-03-21/logs/04-api-test-credentials.log`, `artifacts/f3-auth-split-2026-03-21/auth-linecount.txt`
  - Risco residual: médio
  - Rollback: sim

- [ ] ITEM-ID: F3-P0-RUNTIME-SPLIT
  - Owner: Platform Automation
  - Severidade: P0
  - Prazo: 2026-03-25
  - Evidência: pendente
  - Risco residual: médio
  - Rollback: sim
