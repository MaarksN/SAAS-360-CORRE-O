# F2 — Encerramento da quarentena legada (2026-03-20)

## Status da fase

- **Fase:** F2
- **Estado:** **EM EXECUCAO**
- **Data de revalidacao:** 2026-03-20
- **Objetivo:** remover o ultimo consumidor runtime de `@birthub/db` fora do pacote de compatibilidade e formalizar o status das superficies legadas.

## Mudancas aplicadas

### 1) Dashboard legado migrado para o schema canonico

- `apps/dashboard/package.json` deixa de depender de `@birthub/db` e passa a consumir `@birthub/database`.
- `apps/dashboard/src/lib/data.ts` e `apps/dashboard/src/components/kanban-board.tsx` deixam de importar o pacote legado.
- O `monorepo:doctor` deixa de manter uma quarentena operacional para o dashboard.

### 2) Contrato do workspace endurecido

- `scripts/ci/workspace-contract.json` passa a permitir `@birthub/db` apenas no pacote de compatibilidade `packages/db`.
- O dashboard continua legado como superficie, mas agora usa o contrato de dados canonico.

### 3) Classificacao oficial das superficies legadas

| Superficie | Status | Dono | Regra operacional |
| --- | --- | --- | --- |
| `apps/dashboard` | `sunset` | `@product-frontend` | manter somente correcoes de compatibilidade; sem features novas |
| `apps/api-gateway` | `sunset` | `@platform-api` | compat layer; sem novos contratos publicos |
| `apps/agent-orchestrator` | `sunset` | `@platform-automation` | overlay legado fora da lane core |
| `apps/voice-engine` | `sunset` | `@platform-automation` | mantido apenas por compatibilidade operacional |
| `apps/webhook-receiver` | `sunset` | `@platform-api` | mantido como ingestao secundaria ate consolidacao no core |

## Cronograma de remocao de `packages/db`

1. **Marco 1:** nenhum app em `apps/*` consome `@birthub/db` em runtime.
2. **Marco 2:** `packages/db` permanece apenas como shim de compatibilidade e documentacao de rollback.
3. **Marco 3:** remover o pacote quando `git grep "@birthub/db" -- apps packages agents` retornar apenas documentacao historica aprovada.

## Rollback documentado

- Reverter o dashboard para `@birthub/db` apenas em incidente de compatibilidade comprovado entre schemas.
- Se houver rollback, reabrir a excecao na policy do workspace e registrar owner, prazo e risco residual.

## Template de fechamento (Anexo B)

- [x] ITEM-ID: F2-DASHBOARD-CANONICAL-DB
  - Owner: Product Frontend
  - Severidade: P1
  - Prazo: 2026-03-20
  - Evidencia: `apps/dashboard/package.json`, `apps/dashboard/src/lib/data.ts`, `apps/dashboard/src/components/kanban-board.tsx`
  - Risco residual: baixo
  - Rollback: sim

- [x] ITEM-ID: F2-LEGACY-SURFACES-CLASSIFIED
  - Owner: Platform Architecture
  - Severidade: P1
  - Prazo: 2026-03-20
  - Evidencia: `docs/execution/f2-legacy-quarantine-2026-03-20.md`, `docs/DEPRECACAO_E_CUTOVER.md`
  - Risco residual: medio
  - Rollback: N/A
