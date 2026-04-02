# Rollback Canonical Stack

## Disparo

Acionar rollback quando houver falha de release, regressão crítica ou quebra de integridade operacional.

## Fontes de verdade

- `docs/database/migration-rollback-plan.md`
- `scripts/release/verify-rollback-evidence.ts`
- `artifacts/release/production-rollback-evidence.json`

## Passos

1. Isolar o deploy com falha.
2. Validar a última evidência de rollback registrada.
3. Reverter o deploy via workflow ou mecanismo de infra aprovado.
4. Reapontar serviços dependentes para o estado anterior.
5. Validar `health`, `health/deep`, filas e autenticação.
6. Registrar o incidente e anexar evidência pós-rollback.
