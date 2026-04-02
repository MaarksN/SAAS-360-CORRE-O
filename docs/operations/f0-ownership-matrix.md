# F0 Ownership Matrix

| Domain | Responsible | Escalation | Notes |
| --- | --- | --- | --- |
| Web | Team Web | manager | |
| API | Team API | manager | |
| Worker | Team Backend | manager | |
| Database | Team DBA | manager | |
| Agents | Team AI | manager | |
| Security | Team Sec | manager | |
| DevOps | Team Ops | manager | |

[Wiki Permalink](https://github.com/MaarksN/PROJETO-FINAL-BIRTHUB-360-INNOVATION/wiki/Ownership-Matrix)

## Versionamento
Current Version: 1.0.0

| Segredo crítico | Owner primário | Backup | Rotação mínima |
| --- | --- | --- | --- |
| `DATABASE_URL` | `@platform-data` | `@platform-security` | 90 dias ou incidente |
| `REDIS_URL` | `@platform-worker` | `@platform-api` | 90 dias ou incidente |
| `SESSION_SECRET` | `@platform-security` | `@platform-api` | 60 dias ou incidente |
| `AUTH_MFA_ENCRYPTION_KEY` | `@platform-security` | `@platform-api` | 60 dias ou incidente |
| `JOB_HMAC_GLOBAL_SECRET` | `@platform-security` | `@platform-worker` | 60 dias ou incidente |
| `STRIPE_SECRET_KEY` | `@platform-api` | `@platform-security` | 90 dias ou incidente |
| `STRIPE_WEBHOOK_SECRET` | `@platform-api` | `@platform-security` | 90 dias ou incidente |
| `RENDER_PRODUCTION_DEPLOY_HOOK_URL` | `@platform-devex` | `@platform-architecture` | troca de infra |
| `RENDER_STAGING_DEPLOY_HOOK_URL` | `@platform-devex` | `@platform-architecture` | N/A |
| `SENTRY_DSN` | `@platform-api` | `@platform-devex` | N/A |

Tracking Ticket: https://jira.example.com/browse/BH-100

Calendar Event: ownership-quarterly-review.ics
Next Review Date: 2026-07-01 10:00 America/Sao_Paulo
