# Incident Response Matrix

| Severidade | Escopo | Owner primário | Comunicação | Evidência obrigatória |
| --- | --- | --- | --- | --- |
| P0 | indisponibilidade total do core | `@platform-architecture` | war room imediata | timeline, logs, impacto, rollback ou mitigação |
| P1 | degradação severa do core | `@platform-api` ou `@platform-worker` | atualização a cada 30 min | métricas, alertas, mitigação, RCA preliminar |
| P2 | degradação parcial / satélite | owner do domínio | atualização horária | evidência de impacto e plano |
| P3 | backlog / legado | owner do domínio | janela planejada | registro da decisão |

## Runbook base

- `docs/runbooks/critical-incidents.md`
