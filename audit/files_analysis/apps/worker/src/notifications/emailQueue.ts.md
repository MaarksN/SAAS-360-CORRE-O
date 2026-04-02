# apps/worker/src/notifications/emailQueue.ts

## Purpose
- Executable source under apps. Declares exports such as EmailNotificationJobPayload, emailQueueName, enqueueEmailNotification, processEmailNotificationJob.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: @birthub/config, @birthub/database, @birthub/logger, bullmq
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 50/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 6538 bytes
- SHA-256: dab2fdd7f98326336530976696070049d1b89e6755c7ee021c1a12ebf4151b74
- Direct imports/refs: @birthub/config, @birthub/database, @birthub/logger, bullmq
- Env vars: none
- Related tests: none
