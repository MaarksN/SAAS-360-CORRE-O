# Runtime legacy cutover - inventário e status (2026-03-24)

## Escopo

- `apps/api-gateway`
- `apps/agent-orchestrator`
- `apps/dashboard`
- `packages/db`

## Inventário objetivo

Comando base:

```bash
git grep -n -I -E "apps/api-gateway|apps/agent-orchestrator|packages/db|@birthub/db" -- .
```

Achado consolidado:

1. Não há diretórios ativos `apps/api-gateway` e `apps/agent-orchestrator` no `apps/` atual.
2. Ainda existem referências históricas em docs, auditoria, scripts e políticas de compatibilidade.
3. `packages/db` permanece como superfície legado/shim controlada, sem consumo runtime no core.

## Mapeamento de fluxos residuais

### Fluxos via `api-gateway`

- Situação atual: sem runtime ativo no `HEAD`.
- Resíduo: referências documentais e de histórico de auditoria.
- Ação: manter em `legacy/quarentena` com rota de remoção documental controlada.

### Fluxos via `agent-orchestrator`

- Situação atual: sem runtime ativo no `HEAD`.
- Resíduo: referências em CI/satellites e documentação histórica.
- Ação aplicada nesta execução:
  - CI ajustado para não depender de paths ausentes.
  - runner de satélites ajustado para pular legados ausentes sem quebrar lane canônica.
  - guarda de freeze adicionada: `pnpm ci:legacy-runtime-surface-freeze` (bloqueia nova criação de arquivos em `apps/api-gateway`, `apps/agent-orchestrator` e `apps/dashboard`).

## Próximos passos para sunset físico

1. Remover referências operacionais restantes a `apps/api-gateway` e `apps/agent-orchestrator` em docs/runbooks.
2. Manter `packages/db` somente como compatibilidade até janela de estabilidade aprovada.
3. Executar remoção física final após validação de zero consumidores runtime + aceite de owners.
