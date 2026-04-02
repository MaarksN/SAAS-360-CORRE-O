# Alertas Mínimos de Observabilidade (Foco no Core Canônico)

A operação deve priorizar detecção e resposta para o **core canônico**: `apps/web`, `apps/api`, `apps/worker` e `packages/database`. Alertas de satélite devem ser configurados sem competir com a resposta de incidentes P0 do core.

Fonte canônica de fronteiras: `docs/service-catalog.md`.

## Escopo e severidade

- **P0**: risco imediato ao fluxo principal do core.
- **P1**: degradação relevante sem interrupção total do core.
- **P2**: impacto moderado em satélites.
- **P3**: legado/quarentena, sem rota principal de produção.

Referências de política: `docs/operations/f0-sla-severity-policy.md` e `infra/monitoring/alert.rules.yml`.

## 1) `apps/api` (core)

**Erro HTTP 5xx**
- **Threshold**: `> 1%` das requisições em 5 min.
- **Ação**: `P0`.

**Latência P95**
- **Threshold**: P95 `> 800ms` por 10 min.
- **Ação**: `P1`.

## 2) `apps/web` (core)

**Falha de disponibilidade do front-end**
- **Threshold**: disponibilidade sintética `< 99.5%` em janela de 5 min.
- **Ação**: `P0`.

**Erro de carregamento crítico**
- **Threshold**: aumento sustentado de erro JS crítico (`window.onerror`/chunk load) `> 2%` por 10 min.
- **Ação**: `P1`.

## 3) `apps/worker` (core)

**Backlog de fila**
- **Threshold**: `> 500` jobs pendentes por mais de 5 min sem tendência de queda.
- **Ação**: `P1`.

**DLQ / Falha de job**
- **Threshold**: `> 10%` de jobs em DLQ em 15 min.
- **Ação**: `P0`.

## 4) `packages/database` (core)

**Saturação de conexões/CPU**
- **Threshold**: pool esgotado ou CPU `> 85%` por 10 min.
- **Ação**: `P0`.

**Erro de consulta/transação**
- **Threshold**: taxa de erro de query acima de baseline por 10 min.
- **Ação**: `P0` se indisponibilizar fluxo principal; `P1` caso degradado.

## Satélites e legado

- **Satélites** (`packages/agent-packs`, `apps/webhook-receiver`, `apps/voice-engine`): alertar no máximo em `P1/P2`, com roteamento que não interrompa triagem do core.
- **Legacy/quarentena** (`apps/legacy/dashboard`, `apps/api-gateway`, `apps/agent-orchestrator`, `packages/db`): sem política de alerta `P0`; tratar como `P3` e janela de manutenção.
- **Regra operacional:** nenhuma superfície fora do core pode abrir incidente `P0` por padrão.

## Pós-alerta

A emissão de alerta inicia o runbook de investigação (`docs/runbooks/incident-investigation.md`).
- `P0`: acionamento imediato de on-call.
- `P1`: triagem em até 15 min.
- `P2/P3`: fila operacional e correção programada.
