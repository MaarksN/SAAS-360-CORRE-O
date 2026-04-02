# Migração canônica de banco

## Origem e destino

- Origem: `@birthub/db` (legado).
- Destino: `@birthub/database` (canônico).

## Inventário atual de consumidores de `@birthub/db` (2026-03-24)

Comando de auditoria executado:

```bash
git grep -n -I -E "packages/db|@birthub/db" -- .
```

Classificação consolidada:

| Classe | Situação | Criticidade |
| --- | --- | --- |
| Runtime core (`apps/api`, `apps/web`, `apps/worker`, `packages/database`) | Sem consumidores diretos | P0 protegido |
| Runtime satélite (`apps/webhook-receiver`, `apps/voice-engine`, `packages/agent-packs`) | Sem consumidores diretos | P1/P2 protegido |
| Compatibilidade (`packages/db`) | Mantido como shim legado controlado | P3 |
| Docs/auditoria/scripts históricos | Referências residuais esperadas | P3 |

## Mapa de migração

1. **Baixo risco (já executado):** remover/impedir imports runtime fora de `packages/db`.
2. **Médio risco:** manter `packages/db` apenas como compatibilidade explícita e sem novos contratos.
3. **Alto risco (sunset físico):** remover `packages/db` após janela de estabilização sem rollback e aprovação de Data/API.

## Validação operacional

- `pnpm db:generate`
- `pnpm monorepo:doctor`
- `git grep "@birthub/db" -- apps packages agents`
- `pnpm ci:legacy-db-surface-freeze` (bloqueia novos usos fora de `packages/db` e eixos documentais)
- `pnpm db:check:all` (quando ambiente com banco estiver disponível)
- `pnpm db:seed:smoke` (quando ambiente com banco estiver disponível)

## Cutover

1. Proibir novos imports `@birthub/db` (doctor/CI).
2. Manter `@birthub/db` restrito ao pacote de compatibilidade `packages/db`.
3. Validar migrations, seed, backup e restore no pacote canônico (`packages/database`).
4. Iniciar sunset físico de `packages/db` somente após evidência contínua de zero consumidores runtime críticos.
