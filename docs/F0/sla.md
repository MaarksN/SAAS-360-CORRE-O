# Politica de SLA por Severidade (Snapshot F0)

Documento canonico:

- `docs/operations/f0-sla-severity-policy.md`

## SLA publicado

| Severidade | SLA maximo |
| --- | ---: |
| P0 | <= 2 horas |
| P1 | <= 8 horas |
| P2 | <= 72 horas |
| P3 | <= 2 semanas |

## Evidencias operacionais

- Criterios objetivos, exemplos reais, escalonamento e plano de comunicacao:
  - `docs/operations/f0-sla-severity-policy.md`
- Alertas automaticos (75% e 100% do SLA):
  - `infra/monitoring/alert.rules.yml`
- Dashboard em tempo real:
  - `infra/monitoring/grafana-dashboard.json`
- Baseline de aderencia dos ultimos 90 dias:
  - `docs/operations/f0-sla-adherence-baseline-90d.md`
- Aprovacao formal dos owners tecnicos:
  - secao "Aprovacao Formal da Politica" em `docs/operations/f0-sla-severity-policy.md`
