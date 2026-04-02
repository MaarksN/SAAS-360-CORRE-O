# P1 Alert Response Matrix

| Alerta | Fonte | Ação inicial | Tempo máximo |
| --- | --- | --- | --- |
| `ApiUnauthorizedSpike` | `docs/observability-alerts.md` | validar auth/session e origem do tráfego | 15 min |
| `ApiBudgetExceededSpike` | `docs/observability-alerts.md` | validar billing, rate limit e abuso | 15 min |
| `ApiTaskIngestionRejections` | `docs/observability-alerts.md` | validar fila, payload e guards | 15 min |
| `WorkerFailRateHigh` | `docs/observability-alerts.md` | validar backlog, retries e DLQ | 15 min |

## Escalonamento

- Owner primário conforme `docs/operations/f0-ownership-matrix.md`
- Severidade conforme `docs/operations/f0-sla-severity-policy.md`
