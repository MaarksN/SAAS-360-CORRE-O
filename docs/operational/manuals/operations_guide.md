# Guia de Operações

Este manual consolida o fluxo operacional do stack canônico.

## Escopo

- `apps/web`
- `apps/api`
- `apps/worker`
- `packages/database`

## Comandos obrigatórios

```bash
pnpm monorepo:doctor
pnpm release:scorecard
pnpm docs:verify
pnpm release:preflight:staging
pnpm release:preflight:production
pnpm release:smoke
pnpm test:e2e:release
```

## Gates mínimos

1. `pnpm install --frozen-lockfile`
2. `pnpm monorepo:doctor`
3. `pnpm release:scorecard`
4. `pnpm lint:core`
5. `pnpm typecheck:core`
6. `pnpm test:core`
7. `pnpm test:isolation`
8. `pnpm build:core`
9. `pnpm release:preflight:staging`
10. `pnpm release:preflight:production`
11. `pnpm release:smoke`
12. `pnpm test:e2e:release`

## Referências operacionais

- Deploy: `docs/runbooks/deploy-canonical-stack.md`
- Rollback: `docs/runbooks/rollback-canonical-stack.md`
- Incidentes: `docs/runbooks/incident-response-matrix.md`
- Alertas P1: `docs/runbooks/p1-alert-response-matrix.md`
- Disaster recovery: `docs/runbooks/disaster-recovery.md`
- Processo de release: `docs/release/release-process.md`

## Guardrails

- Não promover superfície legada para fluxo principal sem ADR e aprovação explícita.
- Não executar rollback de schema sem evidência de backup e validação do rehearsal.
- Não usar `apps/dashboard`, `apps/api-gateway`, `apps/agent-orchestrator` ou `packages/db` como prova de pronto do core canônico.
