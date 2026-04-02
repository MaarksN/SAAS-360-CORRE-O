# BirthHub 360 Monorepo

Repositório canônico da plataforma SaaS BirthHub 360.

## Índice operacional único

Fonte única operacional: `docs/service-catalog.md`.

### Core canônico (default)
- `apps/web`
- `apps/api`
- `apps/worker`
- `packages/database`

### Legacy / quarentena (não-default)
- `apps/legacy/dashboard`
- `apps/api-gateway`
- `apps/agent-orchestrator`
- `packages/db`

### Satélites (apoio)
- `packages/agent-packs`
- `apps/webhook-receiver`
- `apps/voice-engine`

## Setup rápido (core)

```bash
pnpm install
pnpm db:generate
pnpm monorepo:doctor
pnpm dev
```

> Use o setup acima para o core canônico. Superfícies em legacy/quarentena não devem ser usadas como fluxo padrão de desenvolvimento.

Não use como entrada default: `apps/legacy/dashboard`, `apps/api-gateway`, `apps/agent-orchestrator` ou `packages/db`.

## Governança e higiene

```bash
pnpm artifacts:clean
pnpm branch:check
pnpm commits:check
pnpm hygiene:check
pnpm docs:check-links
pnpm monorepo:doctor
```

## Documentação principal

- [Service catalog](docs/service-catalog.md)
- [Operational hub](docs/operational/README.md)
- [Service criticality](docs/service-criticality.md)
- [Observability alerts](docs/observability-alerts.md)
- [Contribution guide](CONTRIBUTING.md)
- [Documentation index](docs/README.md)
- [Release process](docs/release/release-process.md)
- [F0 ownership matrix](docs/operations/f0-ownership-matrix.md)
- [Repository naming standard](docs/standards/repository-naming.md)
- [Documentation source of truth](docs/processes/documentation-source-of-truth.md)
- [Internal package graph](docs/architecture/internal-package-graph.md)
- [Dependency approval register](docs/processes/dependency-approval-register.md)
