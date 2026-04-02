# F2 — Encerramento da quarentena legada (2026-03-21)

## Status da fase

- **Fase:** F2
- **Estado:** **CONCLUÍDA (execução técnica local)**
- **Data de revalidação:** 2026-03-21
- **Pré-requisito validado:** F1 concluída com gates de pipeline bloqueantes.
- **Observação de auditoria:** fechamento definitivo depende de PR/merge e validação de owners.

## Critério principal revalidado

Comando de aceite executado:

- `git grep "@birthub/db" -- apps packages agents`

Resultado:

- Ocorrências apenas em `packages/db` (README e `package.json`), sem novos consumidores runtime no core/satélites.
- Evidência: `artifacts/f2-legacy-2026-03-21/logs/01-grep-birthub-db.log`.

## Verificação dos itens mandatórios do dashboard

- `apps/dashboard/package.json` usa `@birthub/database`.
- `apps/dashboard/src/components/kanban-board.tsx` importa `DealStage` de `@birthub/database`.
- `apps/dashboard/src/lib/data.ts` usa `prisma` de `@birthub/database`.

## Classificação das superfícies legadas (status atual)

| Superfície | Classificação | Owner | Diretriz |
| --- | --- | --- | --- |
| `apps/dashboard` | `sunset` | `@product-frontend` | Sem features novas; apenas compatibilidade até desativação |
| `apps/api-gateway` | `sunset` | `@platform-api` | Sem novos contratos públicos |
| `apps/agent-orchestrator` | `sunset` | `@platform-automation` | Compatibilidade e transição controlada |
| `apps/voice-engine` | `sunset` | `@platform-automation` | Operação restrita com plano de retirada |
| `apps/webhook-receiver` | `sunset` | `@platform-api` | Mantido até consolidação do ingest no core |

## Cronograma formal para remoção de `packages/db`

1. **Marco M1 (atingido):** nenhum app em `apps/*` consome `@birthub/db` em runtime.
2. **Marco M2 (próximo):** manter `packages/db` somente como shim de compatibilidade e documentação de rollback.
3. **Marco M3 (target):** remover `packages/db` após janela de estabilização sem rollback e aprovação dos owners de API/Data.

## Rollback documentado

- Rollback permitido apenas sob incidente de compatibilidade comprovado.
- Em rollback, reabrir exceção formal com owner, prazo e risco residual explícitos.

## Template de fechamento (Anexo B)

- [x] ITEM-ID: F2-LEGACY-IMPORT-BLOCK
  - Owner: Platform Architecture
  - Severidade: P0
  - Prazo: 2026-03-21
  - Evidência: `artifacts/f2-legacy-2026-03-21/logs/01-grep-birthub-db.log`
  - Risco residual: baixo
  - Rollback: sim

- [x] ITEM-ID: F2-DASHBOARD-CANONICAL-DB
  - Owner: Product Frontend
  - Severidade: P1
  - Prazo: 2026-03-21
  - Evidência: `apps/dashboard/package.json`, `apps/dashboard/src/components/kanban-board.tsx`, `apps/dashboard/src/lib/data.ts`
  - Risco residual: baixo
  - Rollback: sim

- [x] ITEM-ID: F2-LEGACY-SURFACES-CLASSIFIED
  - Owner: Platform Architecture
  - Severidade: P1
  - Prazo: 2026-03-21
  - Evidência: `docs/execution/f2-legacy-quarantine-2026-03-21.md`
  - Risco residual: médio
  - Rollback: N/A
