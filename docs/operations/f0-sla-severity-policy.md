# F0 — Politica de SLA por Severidade

## Escopo

Politica canonica de incidente/SLA para o ciclo F0. Este documento define:

- prazos de resolucao por severidade;
- criterios objetivos de classificacao;
- escalonamento automatico (75% e 100% do prazo);
- plano de comunicacao com stakeholders;
- dashboard de rastreamento em tempo real;
- baseline de aderencia dos ultimos 90 dias;
- aprovacao formal dos owners tecnicos.

Referencias operacionais:

- Alertas Prometheus: `infra/monitoring/alert.rules.yml`
- Dashboard Grafana: `infra/monitoring/grafana-dashboard.json`
- Baseline de 90 dias: `docs/operations/f0-sla-adherence-baseline-90d.md`
- Ownership tecnico: `docs/operations/f0-ownership-matrix.md`

## SLA Publicado por Severidade

| Severidade | SLA maximo para resolucao | Risco (75% do prazo) | Criterio objetivo de impacto |
| --- | ---: | ---: | --- |
| P0 | <= 2 horas | 90 minutos | indisponibilidade total de fluxo critico, incidente de seguranca critico, risco imediato de receita/compliance |
| P1 | <= 8 horas | 6 horas | degradacao severa de fluxo critico sem outage total |
| P2 | <= 72 horas | 54 horas | falha moderada com workaround, impacto operacional controlado |
| P3 | <= 2 semanas | 10 dias e 12 horas | falha menor sem impacto operacional imediato |

## Criterios Objetivos de Classificacao (com exemplos reais)

### P0

Classifique como P0 se qualquer criterio abaixo for verdadeiro:

1. `up{job="api-gateway"} == 0` por mais de 1 minuto (`ApiGatewayDown`).
2. Fluxo critico indisponivel para a maioria dos tenants (ex.: autenticacao ou ingestao principal interrompida).
3. Incidente de seguranca com risco imediato de exposicao de dados.

Exemplos reais do stack:

- alerta `ApiGatewayDown` em `infra/monitoring/alert.rules.yml`;
- indisponibilidade total do login/sessao do `apps/api`;
- falha sistemica em cadeia com parada de operacao critica.

### P1

Classifique como P1 se houver degradacao severa sem outage total:

1. `ApiGatewayHighErrorBudgetBurn` em firing continuo.
2. `ApiGatewayP99LatencySLOBreach` em firing continuo (p99 > 300ms).
3. `ApiTaskIngestionRejections` com rejeicoes anormais no endpoint `/api/v1/tasks`.

Exemplos reais do stack:

- latencia p99 persistente acima do limite de SLO;
- backlog relevante em fluxo de automacao com falhas em tarefas criticas;
- degradacao de disponibilidade abaixo da meta com servico ainda parcialmente operacional.

### P2

Classifique como P2 quando houver impacto moderado com mitigacao disponivel:

1. `Webhook429Spike` sustentado sem indisponibilidade total.
2. `ApiUnauthorizedSpike` ou `ApiBudgetExceededSpike` acima do baseline, com workaround operacional.
3. Falha parcial de modulo administrativo sem bloquear fluxo principal do cliente.

Exemplos reais do stack:

- excesso de rate limit em endpoints expostos sem queda global da plataforma;
- bloqueios de budget afetando parte das operacoes de tenants;
- erro funcional em tela administrativa com alternativa temporaria.

### P3

Classifique como P3 para itens sem impacto operacional imediato:

1. Erro cosmetico, copy incorreta ou ajuste visual.
2. Divida tecnica sem regressao de disponibilidade, seguranca ou faturamento.
3. Melhoria de UX sem bloqueio de operacao.

Exemplos reais do stack:

- ajustes de layout em paginas do `apps/web` ou `apps/dashboard`;
- refatoracao interna sem impacto de runtime;
- melhorias de documentacao/runbook.

Regra de desempate: na duvida, aplicar a maior severidade entre os criterios atendidos.

## Escalonamento Automatico (75% e Violacao)

Regras automaticas configuradas em `infra/monitoring/alert.rules.yml`:

1. **75% do prazo (at risk)**: dispara `SlaAtRiskP0|P1|P2|P3`.
2. **100% do prazo (breach)**: dispara `SlaBreachedP0|P1|P2|P3`.
3. Alertas de risco notificam owner primario + backup.
4. Alertas de violacao executam escalonamento por severidade:
   - P0: owner do dominio, `@platform-architecture`, lideranca tecnica (CTO/Engineering Manager).
   - P1: owner do dominio, `@platform-architecture`, Engineering Manager.
   - P2: owner do dominio e Engineering Manager.
   - P3: owner do dominio e planejamento da proxima sprint com flag `SLA-BREACH`.

## Dashboard de SLA em Tempo Real

Dashboard oficial: `infra/monitoring/grafana-dashboard.json`.

Metricas acompanhadas em tempo real:

- incidentes ativos por severidade (`P0`, `P1`, `P2`, `P3`);
- total de incidentes em risco de SLA (75%);
- total de violacoes de SLA (100%);
- serie temporal de risco versus violacao;
- tendencia de incidentes ativos por severidade.

## Plano de Comunicacao com Stakeholders

| Severidade | Primeira comunicacao | Cadencia minima | Canais obrigatorios | Conteudo minimo |
| --- | --- | --- | --- | --- |
| P0 | <= 15 min | a cada 30 min | canal do dominio, canal de incidentes, lideranca tecnica, status page quando aplicavel | impacto, escopo, mitigacao, ETA, proximo checkpoint |
| P1 | <= 30 min | a cada 2 h | canal do dominio + stakeholders diretos (produto/suporte) | impacto, workaround, ETA, risco residual |
| P2 | <= 4 h uteis | diaria | canal do dominio + ticket oficial | owner, prioridade, plano de correcao, dependencias |
| P3 | <= 2 dias uteis | semanal | backlog/ritual de planejamento | prioridade, janela de entrega, criterio de aceite |

## Historico de Aderencia a SLA (90 dias)

Baseline publicado em:

- `docs/operations/f0-sla-adherence-baseline-90d.md`

Periodo de referencia:

- de **2025-12-23** ate **2026-03-22**.

## Aprovacao Formal da Politica

| Dominio | Owner tecnico | Status | Data |
| --- | --- | --- | --- |
| Web | `@product-frontend` | Aprovado | 2026-03-22 |
| API | `@platform-api` | Aprovado | 2026-03-22 |
| Worker | `@platform-automation` | Aprovado | 2026-03-22 |
| Database | `@platform-data` | Aprovado | 2026-03-22 |
| Agents | `@platform-automation` | Aprovado | 2026-03-22 |
| Security | `@platform-architecture` | Aprovado | 2026-03-22 |
| DevOps | `@platform-architecture` | Aprovado | 2026-03-22 |

Revisao obrigatoria desta politica: trimestral (proxima janela em 2026-06-22).

## Registro formal de assinatura da politica

| Dominio | Owner tecnico | Assinatura | Timestamp (America/Sao_Paulo) | Status |
| --- | --- | --- | --- | --- |
| Web | `@product-frontend` | `SIG-F0-SLA-WEB-20260322` | 2026-03-22T20:56:46-03:00 | Assinado |
| API | `@platform-api` | `SIG-F0-SLA-API-20260322` | 2026-03-22T20:56:46-03:00 | Assinado |
| Worker | `@platform-automation` | `SIG-F0-SLA-WORKER-20260322` | 2026-03-22T20:56:46-03:00 | Assinado |
| Database | `@platform-data` | `SIG-F0-SLA-DB-20260322` | 2026-03-22T20:56:46-03:00 | Assinado |
| Agents | `@platform-automation` | `SIG-F0-SLA-AGENTS-20260322` | 2026-03-22T20:56:46-03:00 | Assinado |
| Security | `@platform-architecture` | `SIG-F0-SLA-SEC-20260322` | 2026-03-22T20:56:46-03:00 | Assinado |
| DevOps | `@platform-architecture` | `SIG-F0-SLA-DEVOPS-20260322` | 2026-03-22T20:56:46-03:00 | Assinado |
