# Inventário de Variáveis de Ambiente (Staging e Production)

Este documento lista todas as secrets e variáveis exigidas pelos ambientes de **staging** e **production** do BirthHub360, com base nos esquemas de configuração (`packages/config/src`).

Abaixo estão listadas as variáveis separadas por aplicação e contexto, com as respectivas regras de validação para ambientes de produção.

## Aplicação: Web (`packages/config/src/web.config.ts`)

| Variável | Tipo / Validação | Obrigatória em Prod/Staging? | Observação |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | URL HTTPS | **Sim** | Deve apontar para o domínio público HTTPS, não pode ser localhost. |
| `NEXT_PUBLIC_API_URL` | URL HTTPS | **Sim** | Deve apontar para o domínio público HTTPS da API, não pode ser localhost. |
| `NEXT_PUBLIC_CSP_REPORT_ONLY` | Boolean | **Sim** | Obrigatório ser `false` em produção. |
| `NEXT_PUBLIC_SENTRY_DSN` | URL | **Sim** | Deve estar configurado em produção. |
| `NEXTAUTH_SECRET` | String | Depende | Se configurado, **não pode** usar valores temporários/placeholders. |
| `NEXT_PUBLIC_ENVIRONMENT` | String (`production` \| `staging`) | Recomendado | Usado para determinar regras de ambiente. |
| `CSP_REPORT_URI` | URL | Opcional | |
| `NEXT_PUBLIC_POSTHOG_HOST` | URL | Opcional | |
| `NEXT_PUBLIC_POSTHOG_KEY` | String | Opcional | |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | Number | Opcional | Default: `0.1` |
| `SENTRY_AUTH_TOKEN` | String | Opcional | |
| `WEB_PORT` | Number | Opcional | Default: `3001` |

---

## Aplicação: Worker (`packages/config/src/worker.config.ts`)

| Variável | Tipo / Validação | Obrigatória em Prod/Staging? | Observação |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | URL (PostgreSQL) | **Sim** | Deve incluir `sslmode=require` (ou mais forte) em produção. |
| `REDIS_URL` | URL (Redis) | **Sim** | Deve usar TLS (`rediss://` ou `tls=true`) em produção. |
| `JOB_HMAC_GLOBAL_SECRET` | String | **Sim** | Não pode usar o valor default de dev (`dev-job-hmac-secret`) ou placeholders. |
| `SENTRY_DSN` | URL | **Sim** | Deve estar configurado em produção. |
| `BILLING_EXPORT_S3_BUCKET` | String | Condicional | Obrigatório se `BILLING_EXPORT_STORAGE_MODE=s3`. |
| `BILLING_EXPORT_STORAGE_MODE` | Enum (`local`, `s3`) | Recomendado | Default: `local`. |
| `BILLING_EXPORT_LOCAL_DIR` | String | Opcional | Default: `artifacts/billing-exports` |
| `BILLING_EXPORT_S3_ENDPOINT` | URL | Opcional | |
| `BILLING_EXPORT_S3_PREFIX` | String | Opcional | Default: `daily-invoices` |
| `BILLING_EXPORT_S3_REGION` | String | Opcional | Default: `us-east-1` |
| `BILLING_GRACE_PERIOD_DAYS` | Number | Opcional | Default: `3` |
| `EMAIL_FROM_ADDRESS` | String | Opcional | Default: `noreply@birthhub.local` |
| `HUBSPOT_ACCESS_TOKEN` | String | Opcional | |
| `HUBSPOT_BASE_URL` | URL | Opcional | Default: `https://api.hubapi.com` |
| `QUEUE_NAME` | String | Opcional | Default: `birthub-cycle1` |
| `SENDGRID_API_KEY` | String | Opcional | |
| `WEB_BASE_URL` | URL | Opcional | Default: `http://localhost:3001` |
| `WORKER_CONCURRENCY` | Number | Opcional | Default: `Math.max(2, cpus().length)` |

*Existem outras variáveis de timeout e rate limit com defaults definidos para Worker, mas não possuem validação estrita adicional.*

---

## Aplicação: API (`packages/config/src/api.config.ts`)

| Variável | Tipo / Validação | Obrigatória em Prod/Staging? | Observação |
| :--- | :--- | :--- | :--- |
| `SESSION_SECRET` | String | **Sim** | Não pode usar default (`dev-session-secret`) ou placeholders. |
| `JOB_HMAC_GLOBAL_SECRET` | String | **Sim** | Não pode usar default (`dev-job-hmac-secret`) ou placeholders. |
| `AUTH_MFA_ENCRYPTION_KEY` | String | **Sim** | Não pode usar default (`dev-mfa-encryption-key`) ou placeholders. |
| `STRIPE_SECRET_KEY` | String | **Sim** | Não pode usar placeholders. Se ambiente for `production`, não pode ser chave de teste. |
| `STRIPE_WEBHOOK_SECRET` | String | **Sim** | Não pode usar placeholders. |
| `WEB_BASE_URL` | URL HTTPS | **Sim** | Deve apontar para domínio público HTTPS em produção, não pode ser localhost. |
| `STRIPE_SUCCESS_URL` | URL HTTPS | **Sim** | Deve usar HTTPS em produção. |
| `STRIPE_CANCEL_URL` | URL HTTPS | **Sim** | Deve usar HTTPS em produção. |
| `API_CORS_ORIGINS` | Lista separada por vírgula | **Sim** | Deve conter origens de prod aprovadas (sem `*`, `localhost`, `127.0.0.1`). |
| `AUTH_BCRYPT_SALT_ROUNDS` | Number | **Sim** | Deve ser `>= 12` em produção. |
| `DATABASE_URL` | URL (PostgreSQL) | **Sim** | Deve incluir `sslmode=require` (ou mais forte) em produção. |
| `REDIS_URL` | URL (Redis) | **Sim** | Deve usar TLS (`rediss://` ou `tls=true`) em produção. |
| `REQUIRE_SECURE_COOKIES` | Boolean | **Sim** | Deve ser `true` em produção. |
| `SENTRY_DSN` | URL | **Sim** | Deve estar configurado em produção. |
| `API_AUTH_COOKIE_NAME` | String | Opcional | Default: `bh360_session` |
| `API_AUTH_COOKIE_DOMAIN` | String | Opcional | |
| `API_AUTH_REFRESH_COOKIE_NAME`| String | Opcional | Default: `bh360_refresh` |
| `API_CSRF_COOKIE_NAME` | String | Opcional | Default: `bh360_csrf` |
| `API_CSRF_HEADER_NAME` | String | Opcional | Default: `x-csrf-token` |
| `API_KEY_PREFIX` | String | Opcional | Default: `bh360_live` |
| `AUTH_MFA_ISSUER` | String | Opcional | Default: `BirthHub360` |
| `BILLING_GRACE_PERIOD_DAYS` | Number | Opcional | Default: `3` |
| `EXTERNAL_HEALTHCHECK_URLS` | String | Opcional | Default: `""` |
| `GOOGLE_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | String/URL | Opcional | Integrações Google |
| `HUBSPOT_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | String/URL | Opcional | Integrações Hubspot |
| `MICROSOFT_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | String/URL | Opcional | Integrações Microsoft |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | URL | Opcional | |
| `OTEL_SERVICE_NAME` | String | Opcional | Default: `birthub-api` |
| `QUEUE_NAME` | String | Opcional | Default: `birthub-cycle1` |
| `SENTRY_ENVIRONMENT` | String | Opcional | |
| `STRIPE_PORTAL_RETURN_URL` | URL | Opcional | Default: `http://localhost:3001/settings/billing` |
| `UPTIMEROBOT_API_TOKEN` | String | Opcional | |

*Existem outras variáveis para timeouts, cache, e limites de rate, mas elas usam defaults seguros e não possuem regras rígidas exclusivas para produção documentadas neste schema.*
