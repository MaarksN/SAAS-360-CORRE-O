# Disaster Recovery

## Escopo

Recuperação de desastre do core canônico com base em backup/restore e failover documentado.

## Referências

- `docs/runbooks/db-backup-restore.md`
- `docs/database/migration-rollback-plan.md`
- `scripts/ops/check-backup-health.ts`
- `scripts/ops/record-disaster-recovery-drill.ts`

## Procedimento

1. Declarar incidente P0.
2. Congelar mudanças e tráfego mutável.
3. Validar backup íntegro mais recente.
4. Executar restore ou failover conforme o cenário aprovado.
5. Revalidar aplicação, banco, filas e observabilidade.
6. Registrar drill ou incidente com timestamp e owner.
