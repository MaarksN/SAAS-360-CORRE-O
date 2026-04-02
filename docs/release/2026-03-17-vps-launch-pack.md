# VPS Launch Pack - 2026-03-17

## Objetivo

Operar o core canonico sem GCP pago:

- `apps/web`
- `apps/api`
- `apps/worker`
- `packages/database`

## Premissas

- Um unico VPS Linux hospeda `web`, `api`, `worker` e `Caddy`.
- PostgreSQL e Redis ficam em provedores externos com SSL/TLS.
- O deploy usa [`docker-compose.prod.yml`](C:/Users/Marks/Documents/GitHub/BIRTHUB-360-INNOVATION/docker-compose.prod.yml).
- Os segredos vivem apenas em `.env.vps` no servidor.

## Arquivos entregues

- Compose do stack VPS: [`docker-compose.prod.yml`](C:/Users/Marks/Documents/GitHub/BIRTHUB-360-INNOVATION/docker-compose.prod.yml)
- Exemplo de ambiente: [`.env.vps.example`](C:/Users/Marks/Documents/GitHub/BIRTHUB-360-INNOVATION/.env.vps.example)
- Checklist de preenchimento: [`2026-03-17-vps-env-checklist.md`](C:/Users/Marks/Documents/GitHub/BIRTHUB-360-INNOVATION/docs/release/2026-03-17-vps-env-checklist.md)
- Proxy HTTPS: [`ops/vps/Caddyfile`](C:/Users/Marks/Documents/GitHub/BIRTHUB-360-INNOVATION/ops/vps/Caddyfile)
- Deploy: [`deploy-vps.sh`](C:/Users/Marks/Documents/GitHub/BIRTHUB-360-INNOVATION/scripts/ops/deploy-vps.sh)
- Backup: [`backup-postgres.sh`](C:/Users/Marks/Documents/GitHub/BIRTHUB-360-INNOVATION/scripts/ops/backup-postgres.sh)
- Restore: [`restore-postgres.sh`](C:/Users/Marks/Documents/GitHub/BIRTHUB-360-INNOVATION/scripts/ops/restore-postgres.sh)

## Sequencia de cutover barato

1. Provisionar o VPS com Docker Engine e Compose.
2. Copiar o repositorio para o servidor.
3. Gerar `.env.vps` com `pnpm ops:vps:env`.
4. Preencher todos os valores reais restantes com apoio do checklist de ambiente.
5. Rodar `pnpm ops:vps:preflight`.
6. Ajustar o que o preflight reprovar.
7. Apontar `APP_DOMAIN` e `API_DOMAIN` para o IP do VPS.
8. Rodar `bash scripts/ops/deploy-vps.sh --env-file .env.vps`.
9. Validar:
   - `https://APP_DOMAIN/health`
   - `https://API_DOMAIN/health`
   - login
   - sessao
   - billing
   - worker
10. Rodar backup inicial do banco.

## Notas operacionais

- Nao use PostgreSQL e Redis locais sem TLS para este perfil. O codigo exige SSL/TLS em producao.
- Se quiser custo minimo real, o VPS hospeda apenas a camada de aplicacao. O plano de dados fica em provedores baratos ou free tier com TLS.
- O worker grava exports locais em um volume nomeado dedicado.
- O restore exige `--force` para evitar acidente operacional.

## Comandos

```bash
pnpm ops:vps:env -- --force --output .env.vps
pnpm ops:vps:preflight
bash scripts/ops/deploy-vps.sh --env-file .env.vps
bash scripts/ops/backup-postgres.sh --env-file .env.vps
bash scripts/ops/restore-postgres.sh --env-file .env.vps --force artifacts/backups/SEU_BACKUP.dump
```
