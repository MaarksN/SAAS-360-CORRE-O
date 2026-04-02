# Comunicação de mudança — fronteiras core vs legacy vs satélites

## Objetivo

Alinhar operação, on-call e planejamento para a taxonomia canônica do repositório, removendo trilhas conflitantes de backlog.

Fonte única operacional: `docs/service-catalog.md`.

## Resumo da mudança

- **Core canônico (default):** `apps/web`, `apps/api`, `apps/worker`, `packages/database`.
- **Legacy/quarentena (não-default):** `apps/legacy/dashboard`, `apps/api-gateway`, `apps/agent-orchestrator`, `packages/db`.
- **Satélites operacionais:** `packages/agent-packs`, `apps/webhook-receiver`, `apps/voice-engine`.

## Instrução para on-call

1. Abrir incidente **P0** somente para superfícies do core canônico.
2. Tratar satélites em **P1/P2**, sem interromper resposta do core.
3. Tratar legado/quarentena em **P3** e janela de manutenção.
4. Em caso de dúvida, priorizar `docs/service-catalog.md` sobre qualquer outra referência.

Referências:
- `docs/service-criticality.md`
- `docs/observability-alerts.md`

## Instrução para planejamento

1. Não criar novos itens de roadmap principal para superfícies em legacy/quarentena.
2. Reclassificar itens de backlog de legado para trilha de manutenção/descomissionamento.
3. Garantir que novos épicos de plataforma apontem para serviços do core canônico.
4. Usar satélites apenas quando houver dependência explícita de domínio.

## Checklist de zeragem de backlog conflitante

- [ ] Revisar board e remover labels de "core" de itens de legado.
- [ ] Migrar itens ativos de legado para "quarentena".
- [ ] Revalidar ownership com `.github/CODEOWNERS`.
- [ ] Confirmar SLO/alertas conforme `docs/observability-alerts.md`.
- [ ] Comunicar conclusão em canal operacional do time.
