# Target Architecture

## Current State
- apps/web exists as the web entrypoint.
- apps/api exists as the synchronous API, auth and metrics surface.
- apps/worker exists as the asynchronous execution and notification runtime.
- packages/* contains shared capabilities including auth, config, database, logger, queue and workflows.
- agents/* and packages/agent-* coexist as agent runtime/control-plane surfaces.
- Postgres + Prisma + RLS migrations are present in packages/database.
- Redis + BullMQ are present in apps/api, apps/worker and packages/queue.
- OpenTelemetry, Prometheus-style metrics and Sentry are present in core apps.

## Ideal State
- apps/web remains the only user-facing application boundary.
- apps/api owns sync request/response paths, auth, billing, connectors and read/write APIs.
- apps/worker owns async execution, webhooks, notifications, scheduled jobs and event fan-out.
- packages/database owns tenant context, RLS-safe repositories, migrations and seed/runtime DB contracts.
- packages/logger, packages/queue and packages/config remain the mandatory observability/runtime primitives for every executable surface.
- agents/* and packages/agent-* are treated as isolated domain workers behind the same queue, auth and telemetry contract.

## Textual Diagram
```text
[web] -> [api] -> [database/postgres + RLS]
            |
            +-> [redis/bullmq] -> [worker] -> [agents/*]
            |                        |
            |                        +-> [notifications/webhooks]
            +-> [metrics + traces + sentry]
```

## Current vs Ideal
| Area | Current | Ideal |
| --- | --- | --- |
| Web | Next.js app exists | Keep as sole UI edge |
| API | Express API with auth, metrics and queue integration | Keep sync-only, with stricter policy enforcement at boundaries |
| Worker | BullMQ-based async runtime exists | Keep as async/event execution plane with all side effects centralized |
| Data | Prisma + Postgres + RLS migrations exist | Keep Postgres as system of record and require DB-backed proof in audits |
| Observability | Logger, OTEL, metrics and Sentry exist in core apps | Extend the same contract to legacy agent workers and all outbound integrations |
| Security | Auth, CSRF, rate limit, RLS and security CI exist | Keep and make DB-backed proof mandatory in repeatable audit runs |
