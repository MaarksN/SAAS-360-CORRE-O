# Etapa 3 — Simulação de indisponibilidade de dependências

Data: 2026-03-24

## Cenário 1: Web `/health` com API obrigatória indisponível

Comando executado (em `apps/web`):

- `corepack pnpm --filter @birthub/web exec node --import tsx -e "process.env.NEXT_PUBLIC_ENVIRONMENT='development'; process.env.NEXT_PUBLIC_API_URL='http://api.internal.local'; globalThis.fetch=async()=>new Response(JSON.stringify({status:'down'}),{status:503}); const mod = await import('./app/health/route.ts'); const response = await mod.default.GET(); console.log('WEB_HEALTH_STATUS='+response.status); console.log('WEB_HEALTH_BODY='+await response.text());"`

Resposta real observada:

- `WEB_HEALTH_STATUS=503`
- `WEB_HEALTH_BODY={"checkedAt":"2026-03-24T18:47:19.928Z","dependencies":[{"httpStatus":503,"latencyMs":2,"mandatory":true,"name":"api","status":"down","url":"http://api.internal.local/api/v1/health","message":"Dependency responded with non-success status code 503."}],"service":"web","status":"degraded"}`

## Cenário 2: Worker `/readiness` com Redis indisponível (contrato operacional)

Comando executado (em `apps/worker`):

- `corepack pnpm --filter @birthub/worker exec node --import tsx -e "const { evaluateWorkerReadiness } = await import('./src/operational/readiness.ts'); const payload = await evaluateWorkerReadiness({ pingRedis: async()=>{ throw new Error('ECONNREFUSED redis:6379'); }, listQueueStates: async()=>[{name:'birthub-cycle1',backlog:12,dlq:3}], workerCount:1, queueCount:1 }); const status = payload.status === 'ok' ? 200 : 503; console.log('WORKER_READINESS_STATUS='+status); console.log('WORKER_READINESS_BODY='+JSON.stringify(payload));"`

Resposta real observada:

- `WORKER_READINESS_STATUS=503`
- `WORKER_READINESS_BODY={"checkedAt":"2026-03-24T18:46:43.394Z","dependencies":{"redis":{"message":"ECONNREFUSED redis:6379","status":"down"},"runtime":{"backlog":12,"dlq":3,"queueCount":1,"status":"up","workerCount":1}},"queues":[{"name":"birthub-cycle1","backlog":12,"dlq":3}],"service":"worker","status":"degraded"}`
