# Internal Package Graph

## Canonical graph

```mermaid
graph TD
  web["@birthub/web"] --> config["@birthub/config"]
  web --> logger["@birthub/logger"]
  web --> workflows["@birthub/workflows-core"]
  api["@birthub/api"] --> database["@birthub/database"]
  api --> config
  api --> logger
  api --> workflows
  worker["@birthub/worker"] --> database
  worker --> config
  worker --> logger
  worker --> workflows
  worker --> testing["@birthub/testing"]
  queue["@birthub/queue"] --> sharedTypes["@birthub/shared-types"]
  apiGateway["@birthub/api-gateway"] --> queue
  apiGateway --> sharedTypes
  dbCompat["@birthub/db (legacy)"] --> database
```

## Notes

- `@birthub/database` é o schema canônico multi-tenant.
- `@birthub/db` permanece como camada de compatibilidade legada e não pode ganhar novos consumidores runtime fora da exceção documentada.
- Dependências internas devem usar `workspace:*` em todos os manifests.
- Mudanças em `package.json` internos exigem atualização do changelog em `docs/release/internal-packages-changelog.md`.
