# F1 — Estabilização de pipeline e gates obrigatórios (início em 2026-03-20)

## Status da fase

- **Fase:** F1
- **Estado:** **EM EXECUÇÃO**
- **Pré-requisito validado:** F0 concluída com baseline verde.

## Itens executados nesta abertura de F1

### 1) Tipagem Python sem tolerância silenciosa

- Atualizado workflow principal para remover tolerância `mypy ... || true`.
- Novo comportamento: qualquer erro de tipagem Python falha o job `workflow-suite`.

### 2) Gate de governança acoplado ao status final de CI

- Job agregador `ci` agora depende explicitamente de `governance-gates`.
- Efeito prático: o check consolidado falha caso `monorepo:doctor` ou `release:scorecard` falhem.

### 3) Resolução de pipeline legado ambíguo

- Removido `.github/workflows/ci.yml.disabled` para eliminar ambiguidade de pipeline paralelo legado.

## Itens F1 ainda pendentes

- [x] Formalizar branch protection declarativa em `main` exigindo check obrigatório `governance-gates` e o agregador `ci` via `.github/settings.yml`.
- [x] Validar que o install congelado permanece obrigatório em todos os jobs Node do CI.
- [x] Confirmar ausência de drift de versão de Node em repositório + ambientes locais suportados com `node-version-file: .nvmrc` e `engines.node`.

## Template de fechamento (Anexo B)

- [x] ITEM-ID: F1-PY-MYPY-BLOCKING
  - Owner: Platform DevOps
  - Severidade: P0
  - Prazo: 2026-03-20
  - Evidência: `.github/workflows/ci.yml`
  - Risco residual: baixo
  - Rollback: sim

- [x] ITEM-ID: F1-GOVERNANCE-GATES-ON-CI
  - Owner: Platform DevOps
  - Severidade: P0
  - Prazo: 2026-03-20
  - Evidência: `.github/workflows/ci.yml`
  - Risco residual: baixo
  - Rollback: sim

- [x] ITEM-ID: F1-LEGACY-CI-RESOLUTION
  - Owner: Platform DevOps
  - Severidade: P1
  - Prazo: 2026-03-20
  - Evidência: remoção de `.github/workflows/ci.yml.disabled`
  - Risco residual: baixo
  - Rollback: sim
