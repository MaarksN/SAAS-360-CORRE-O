# Contributing

Este repositório segue a baseline F9 de higiene estrutural. Toda mudança deve preservar naming, rastreabilidade documental e guardrails de CI.

## Workspace e dependências

- O monorepo usa `pnpm`.
- Toda dependência interna `@birthub/*` deve usar `workspace:*`.
- Novas dependências externas exigem registro em `docs/processes/dependency-approval-register.md`.
- Mudanças em manifestos de pacotes internos exigem atualização em `docs/release/internal-packages-changelog.md`.

## Branches

Use um dos prefixos abaixo para branches humanas:

- `feat/`
- `fix/`
- `refactor/`
- `chore/`
- `release/`
- `hotfix/`

Branches automatizadas `codex/`, `jules/` e `dependabot/` continuam permitidas para integrações e agentes.

## Commits

Use Conventional Commits:

```text
feat(api): add workflow pause endpoint
fix(worker): prevent duplicate queue scheduling
docs(repo): refresh contribution guide
```

Exceções temporárias só podem existir em `.github/commit-message-allowlist.txt`.

## Naming

- Diretórios internos em `agents/` usam `snake_case`.
- Identificadores públicos, filas, slugs e manifests usam `kebab-case`.
- Arquivos TypeScript de camada usam `*.service.ts`, `*.controller.ts`, `*.repository.ts` e `*.types.ts`.
- `agents/pos-venda/main.py` é um shim legado somente leitura. Novas mudanças devem ir para `agents/pos_venda/`.
- Novos ADRs devem ser publicados em `docs/adrs/`.

Regra completa: `docs/standards/repository-naming.md`.

## Documentação

Toda mudança relevante deve apontar para uma fonte de verdade canônica e, quando necessário, registrar documentos históricos ou superseded em `docs/processes/documentation-source-of-truth.md`.

Use o template padrão em `docs/templates/documentation-template.md`.

## Artifacts

- `artifacts/` guarda apenas evidências auditáveis e saídas formais de release/compliance.
- Logs de runtime, dumps, `.env`, temporários e saídas locais não devem ser versionados.
- Limpeza automatizada roda via `pnpm artifacts:clean`.

Política completa: `artifacts/README.md`.

## Checklist mínimo local

```bash
pnpm artifacts:clean
pnpm branch:check
pnpm commits:check
pnpm hygiene:check
pnpm docs:check-links
pnpm monorepo:doctor
```
