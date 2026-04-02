# F1 — Estabilização de pipeline e gates obrigatórios (2026-03-21)

## Status da fase

- **Fase:** F1
- **Estado:** **CONCLUÍDA (execução técnica local)**
- **Pré-requisito validado:** F0 concluída com baseline verde em `docs/execution/f0-governance-baseline-2026-03-21.md`.
- **Observação de auditoria:** fechamento definitivo depende de PR com links e aplicação da proteção de branch em ambiente GitHub.

## Itens obrigatórios e evidência

1. **`install --frozen-lockfile` como gate obrigatório em PR para `main`**
   - Evidência: `.github/workflows/ci.yml` (`security-guardrails`, `platform`, `pack-tests`, `workflow-suite`, `governance-gates`) com `pnpm install --frozen-lockfile`.

2. **`governance-gates` como status check obrigatório em proteção de branch**
   - Evidência declarativa: `.github/settings.yml` em `branches.main.protection.required_status_checks.contexts` contém `governance-gates` e `ci`.

3. **Remoção de tolerância silenciosa `mypy ... || true`**
   - Evidência: `.github/workflows/ci.yml` (`workflow-suite`) executa `mypy agents/shared apps/webhook-receiver/src` de forma bloqueante.

4. **Resolução de `ci.yml.disabled`**
   - Evidência: arquivo não existe em `.github/workflows`.

5. **Padronização de versão de Node entre workflows e toolchain local**
   - Evidência:
     - `.nvmrc` = `24.14.0`.
     - `package.json` (`engines.node`) = `>=24 <25`.
     - `actions/setup-node` no `ci.yml` atualizado para `node-version-file: .nvmrc` também no job `governance-gates`.

## Template de fechamento (Anexo B)

- [x] ITEM-ID: F1-FROZEN-LOCKFILE-GATE
  - Owner: Platform DevOps
  - Severidade: P0
  - Prazo: 2026-03-21
  - Evidência: `.github/workflows/ci.yml`
  - Risco residual: baixo
  - Rollback: sim

- [x] ITEM-ID: F1-GOVERNANCE-GATES-BRANCH-PROTECTION
  - Owner: Platform DevOps
  - Severidade: P0
  - Prazo: 2026-03-21
  - Evidência: `.github/settings.yml`
  - Risco residual: baixo
  - Rollback: sim

- [x] ITEM-ID: F1-MYPY-BLOCKING
  - Owner: Platform DevOps
  - Severidade: P0
  - Prazo: 2026-03-21
  - Evidência: `.github/workflows/ci.yml`
  - Risco residual: baixo
  - Rollback: sim

- [x] ITEM-ID: F1-LEGACY-CI-RESOLUTION
  - Owner: Platform DevOps
  - Severidade: P1
  - Prazo: 2026-03-21
  - Evidência: ausência de `.github/workflows/ci.yml.disabled`
  - Risco residual: baixo
  - Rollback: sim

- [x] ITEM-ID: F1-NODE-VERSION-STANDARDIZATION
  - Owner: Platform DevOps
  - Severidade: P1
  - Prazo: 2026-03-21
  - Evidência: `.nvmrc`, `package.json`, `.github/workflows/ci.yml`
  - Risco residual: baixo
  - Rollback: sim

## Risco residual da fase

- **Baixo** para comportamento técnico do pipeline no repositório.
- **Médio** até validação em PR real contra branch protegida no GitHub.
