# F2-100 — Varredura `@birthub/db`

Data (UTC): 2026-03-25
Comando: git grep -n '@birthub/db' -- .
Total de ocorrências: 126
Ocorrências em runtime/código: 29
Ocorrências em documentação: 96
Ocorrências em metadata de pacote: 1

## Runtime/Código

- docs/programs/12-ciclos/F11.html:960:                    <div class="task-text">F2: Confirmar evidências — zero @birthub/db novos, cronograma sunset publicado</div>
- docs/programs/12-ciclos/F2.html:684:                    <span class="section-title">1. Eliminação de @birthub/db — Consumo Runtime</span>
- docs/programs/12-ciclos/F2.html:725:                    <div class="task-text">Executar git grep '@birthub/db' em todo o repositório e registrar achados</div>
- docs/programs/12-ciclos/F2.html:749:                    <div class="task-text">Validar que CI bloqueia novos imports de @birthub/db (lint rule customizada)</div>
- docs/programs/12-ciclos/F2.html:757:                    <div class="task-text">Executar verificação final: git grep '@birthub/db' deve retornar zero resultados</div>
- docs/programs/12-ciclos/F2.html:765:                    <span class="section-title">2. Migração Incremental @birthub/db → @birthub/database</span>
- docs/programs/12-ciclos/F4.html:822:                    <div class="task-text">Adicionar regra customizada: proibir imports de @birthub/db sem exception aprovada</div>
- docs/programs/12-ciclos/F9.html:944:                    <div class="task-text">Implementar lint rule customizada: bloquear novos imports de @birthub/db fora de exceção</div>
- docs/programs/internal/prompt_soberano_v13.html:899:        <li>Inventariar todos os imports de <code>@birthub/db</code> no monorepo — classificar por risco</li>
- docs/programs/internal/prompt_soberano_v13.html:1288:- Inventariar todos os imports de @birthub/db no monorepo
- eslint.config.mjs:58:              "group": ["@birthub/db", "@birthub/db/*"],
- eslint.config.mjs:59:              "message": "Importing from @birthub/db is prohibited without formal exception."
- scripts/_generate_forensic_audit.py:60:# Checagem de legado @birthub/db em código (não docs)
- scripts/_generate_forensic_audit.py:74:        if "@birthub/db" in txt:
- scripts/_generate_forensic_audit.py:196:        if "@birthub/db" in t:
- scripts/_generate_forensic_audit.py:199:                evidence = "Sem novos imports runtime de @birthub/db fora do pacote legado."
- scripts/ci/check-legacy-db-surface-freeze.mjs:40:const rawMatches = safeRun("git grep -n -I -E '@birthub/db|packages/db' -- .");
- scripts/ci/check-legacy-db-surface-freeze.mjs:64:  console.error("Only docs/artifacts/diagnostics and packages/db compatibility layer may reference '@birthub/db' or 'packages/db'.");
- scripts/ci/monorepo-doctor.mjs:115:const legacyImportRule = workspaceContract.importRules.find((rule) => rule.packageName === '@birthub/db');
- scripts/ci/monorepo-doctor.mjs:118:  return c.includes('@birthub/db')?[f]:[];
- scripts/ci/monorepo-doctor.mjs:127:  critical.push(`Forbidden @birthub/db imports found outside the legacy quarantine: ${legacyImportViolations.join(', ')}`);
- scripts/ci/monorepo-doctor.mjs:130:  warnings.push(`Legacy quarantine still active for @birthub/db in: ${legacyImportQuarantine.join(', ')}`);
- scripts/ci/workspace-contract.json:55:      "description": "@birthub/db is frozen legacy CRM schema. New code must use @birthub/database and imports are restricted to the packages/db compatibility layer only.",
- scripts/ci/workspace-contract.json:56:      "packageName": "@birthub/db"
- scripts/diagnostics/audit-legacy-db-imports.mjs:67:const grepOutput = runGit("git grep -n '@birthub/db' -- .");
- scripts/diagnostics/audit-legacy-db-imports.mjs:77:  '# F2-100 — Varredura `@birthub/db`',
- scripts/diagnostics/audit-legacy-db-imports.mjs:80:  `Comando: git grep -n '@birthub/db' -- .`,
- scripts/diagnostics/materialize-doc-only-controls.mjs:251:  if (!content.includes("@birthub/db")) {
- scripts/testing/run-shard.mjs:20:    "@birthub/db",

## Documentação

- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:1:# F2-100 — Varredura `@birthub/db`
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:4:Comando: git grep -n '@birthub/db' -- .
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:12:- docs/programs/12-ciclos/F11.html:960:                    <div class="task-text">F2: Confirmar evidências — zero @birthub/db novos, cronograma sunset publicado</div>
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:13:- docs/programs/12-ciclos/F2.html:684:                    <span class="section-title">1. Eliminação de @birthub/db — Consumo Runtime</span>
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:14:- docs/programs/12-ciclos/F2.html:725:                    <div class="task-text">Executar git grep '@birthub/db' em todo o repositório e registrar achados</div>
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:15:- docs/programs/12-ciclos/F2.html:749:                    <div class="task-text">Validar que CI bloqueia novos imports de @birthub/db (lint rule customizada)</div>
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:16:- docs/programs/12-ciclos/F2.html:757:                    <div class="task-text">Executar verificação final: git grep '@birthub/db' deve retornar zero resultados</div>
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:17:- docs/programs/12-ciclos/F2.html:765:                    <span class="section-title">2. Migração Incremental @birthub/db → @birthub/database</span>
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:18:- docs/programs/12-ciclos/F4.html:822:                    <div class="task-text">Adicionar regra customizada: proibir imports de @birthub/db sem exception aprovada</div>
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:19:- docs/programs/12-ciclos/F9.html:944:                    <div class="task-text">Implementar lint rule customizada: bloquear novos imports de @birthub/db fora de exceção</div>
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:20:- docs/programs/internal/prompt_soberano_v13.html:899:        <li>Inventariar todos os imports de <code>@birthub/db</code> no monorepo — classificar por risco</li>
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:21:- docs/programs/internal/prompt_soberano_v13.html:1288:- Inventariar todos os imports de @birthub/db no monorepo
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:22:- eslint.config.mjs:58:              "group": ["@birthub/db", "@birthub/db/*"],
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:23:- eslint.config.mjs:59:              "message": "Importing from @birthub/db is prohibited without formal exception."
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:24:- scripts/_generate_forensic_audit.py:60:# Checagem de legado @birthub/db em código (não docs)
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:25:- scripts/_generate_forensic_audit.py:74:        if "@birthub/db" in txt:
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:26:- scripts/_generate_forensic_audit.py:196:        if "@birthub/db" in t:
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:27:- scripts/_generate_forensic_audit.py:199:                evidence = "Sem novos imports runtime de @birthub/db fora do pacote legado."
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:28:- scripts/ci/check-legacy-db-surface-freeze.mjs:40:const rawMatches = safeRun("git grep -n -I -E '@birthub/db|packages/db' -- .");
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:29:- scripts/ci/check-legacy-db-surface-freeze.mjs:64:  console.error("Only docs/artifacts/diagnostics and packages/db compatibility layer may reference '@birthub/db' or 'packages/db'.");
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:30:- scripts/ci/monorepo-doctor.mjs:115:const legacyImportRule = workspaceContract.importRules.find((rule) => rule.packageName === '@birthub/db');
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:31:- scripts/ci/monorepo-doctor.mjs:118:  return c.includes('@birthub/db')?[f]:[];
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:32:- scripts/ci/monorepo-doctor.mjs:127:  critical.push(`Forbidden @birthub/db imports found outside the legacy quarantine: ${legacyImportViolations.join(', ')}`);
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:33:- scripts/ci/monorepo-doctor.mjs:130:  warnings.push(`Legacy quarantine still active for @birthub/db in: ${legacyImportQuarantine.join(', ')}`);
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:34:- scripts/ci/workspace-contract.json:55:      "description": "@birthub/db is frozen legacy CRM schema. New code must use @birthub/database and imports are restricted to the packages/db compatibility layer only.",
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:35:- scripts/ci/workspace-contract.json:56:      "packageName": "@birthub/db"
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:36:- scripts/diagnostics/audit-legacy-db-imports.mjs:67:const grepOutput = runGit("git grep -n '@birthub/db' -- .");
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:37:- scripts/diagnostics/audit-legacy-db-imports.mjs:77:  '# F2-100 — Varredura `@birthub/db`',
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:38:- scripts/diagnostics/audit-legacy-db-imports.mjs:80:  `Comando: git grep -n '@birthub/db' -- .`,
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:39:- scripts/diagnostics/materialize-doc-only-controls.mjs:251:  if (!content.includes("@birthub/db")) {
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:40:- scripts/testing/run-shard.mjs:20:    "@birthub/db",
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:44:- audit/F8_cycles.md:73:12. Habilitar regra `no-restricted-imports` para `@birthub/db`. (Critério: ESLint att).
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:45:- docs/MONOREPO_DOCTOR.md:6:- imports legados `@birthub/db`
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:46:- docs/adrs/ADR-031-monorepo-source-of-truth.md:6:- `@birthub/database` vs `@birthub/db`
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:47:- docs/adrs/ADR-031-monorepo-source-of-truth.md:18:2. `@birthub/db` permanece como schema legado de CRM e fica isolado em `apps/dashboard`, `apps/api-gateway`, `apps/agent-orchestrator` e `packages/db` até a migração dirigida.
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:48:- docs/adrs/ADR-031-monorepo-source-of-truth.md:32:1. Migrar um domínio legado por vez de `@birthub/db` para `@birthub/database`.
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:49:- docs/adrs/ADR-033-billing-canonical-schema-cutover.md:11:2. Legacy CRM runtime on `@birthub/db` (schema drift and incompatible domain models).
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:50:- docs/adrs/ADR-033-billing-canonical-schema-cutover.md:21:3. `@birthub/db` is frozen legacy compatibility and cannot be imported by `apps/api-gateway` or `apps/agent-orchestrator`.
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:51:- docs/adrs/ADR-033-billing-canonical-schema-cutover.md:29:- Removes active `@birthub/db` usage from supported gateway/orchestrator surfaces.
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:52:- docs/architecture/internal-package-graph.md:22:  dbCompat["@birthub/db (legacy)"] --> database
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:53:- docs/architecture/internal-package-graph.md:28:- `@birthub/db` permanece como camada de compatibilidade legada e não pode ganhar novos consumidores runtime fora da exceção documentada.
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:54:- docs/evidence/2026-03-24-core-hardening-execution.md:106:  - objetivo: bloquear regressão de referências a `@birthub/db`/`packages/db` fora de `packages/db` e eixos documentais.
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:55:- docs/evidence/db-package-fix.md:3:O monorepo BirthHub estava apresentando falhas de importação nos testes de integração do `api-gateway` e em outros locais com a mensagem `"The requested module '@birthub/db' does not provide an export named 'prisma'"`. A causa raiz era que o pacote `@birthub/db` não tinha uma estrutura válida de ESM/NodeNext, nem compilação de fato para que os importadores pudessem consumir adequadamente a exportação nominal do Prisma.
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:56:- docs/evidence/db-package-fix.md:23:        "name": "@birthub/db",
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:57:- docs/evidence/db-package-fix.md:64:O Node conseguiu resolver o pacote `@birthub/db` pelo seu entrypoint público (`@birthub/db` que redireciona para `./dist/index.js`). Os testes do `api-gateway` deixaram de lançar erros de sintaxe ou módulo não encontrado, terminando em 73 passes no total (`pnpm test --filter=@birthub/api-gateway`).
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:58:- docs/execution/f2-legacy-quarantine-2026-03-20.md:8:- **Objetivo:** remover o ultimo consumidor runtime de `@birthub/db` fora do pacote de compatibilidade e formalizar o status das superficies legadas.
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:59:- docs/execution/f2-legacy-quarantine-2026-03-20.md:14:- `apps/dashboard/package.json` deixa de depender de `@birthub/db` e passa a consumir `@birthub/database`.
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:60:- docs/execution/f2-legacy-quarantine-2026-03-20.md:20:- `scripts/ci/workspace-contract.json` passa a permitir `@birthub/db` apenas no pacote de compatibilidade `packages/db`.
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:61:- docs/execution/f2-legacy-quarantine-2026-03-20.md:35:1. **Marco 1:** nenhum app em `apps/*` consome `@birthub/db` em runtime.
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:62:- docs/execution/f2-legacy-quarantine-2026-03-20.md:37:3. **Marco 3:** remover o pacote quando `git grep "@birthub/db" -- apps packages agents` retornar apenas documentacao historica aprovada.
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:63:- docs/execution/f2-legacy-quarantine-2026-03-20.md:41:- Reverter o dashboard para `@birthub/db` apenas em incidente de compatibilidade comprovado entre schemas.
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:64:- docs/execution/f2-legacy-quarantine-2026-03-21.md:15:- `git grep "@birthub/db" -- apps packages agents`
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:65:- docs/execution/f2-legacy-quarantine-2026-03-21.md:40:1. **Marco M1 (atingido):** nenhum app em `apps/*` consome `@birthub/db` em runtime.
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:66:- docs/execution/runtime-legacy-cutover-2026-03-24.md:15:git grep -n -I -E "apps/api-gateway|apps/agent-orchestrator|packages/db|@birthub/db" -- .
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:67:- docs/f10/dependency-graph.md:45:    _birthub_db["@birthub/db"]
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:68:- docs/migration/legacy-api-gateway-strangler.md:21:- Move consumers from `@birthub/db` to `@birthub/database`.
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:69:- docs/processes/MIGRACAO_CANONICA_DB.md:5:- Origem: `@birthub/db` (legado).
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:70:- docs/processes/MIGRACAO_CANONICA_DB.md:8:## Inventário atual de consumidores de `@birthub/db` (2026-03-24)
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:71:- docs/processes/MIGRACAO_CANONICA_DB.md:13:git grep -n -I -E "packages/db|@birthub/db" -- .
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:72:- docs/processes/MIGRACAO_CANONICA_DB.md:35:- `git grep "@birthub/db" -- apps packages agents`
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:73:- docs/processes/MIGRACAO_CANONICA_DB.md:42:1. Proibir novos imports `@birthub/db` (doctor/CI).
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:74:- docs/processes/MIGRACAO_CANONICA_DB.md:43:2. Manter `@birthub/db` restrito ao pacote de compatibilidade `packages/db`.
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:75:- docs/release/f11-executive-summary-2026-03-22.md:22:- Legacy `@birthub/db` usage is quarantined to the deprecated package itself and its README in the current grep scope.
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:79:- docs/programs/12-ciclos/F2.html:701:                    <div class="task-text">Auditar apps/dashboard/package.json: remover @birthub/db ou registrar exceção formal</div>
- audit/F8_cycles.md:73:12. Habilitar regra `no-restricted-imports` para `@birthub/db`. (Critério: ESLint att).
- docs/MONOREPO_DOCTOR.md:6:- imports legados `@birthub/db`
- docs/adrs/ADR-031-monorepo-source-of-truth.md:6:- `@birthub/database` vs `@birthub/db`
- docs/adrs/ADR-031-monorepo-source-of-truth.md:18:2. `@birthub/db` permanece como schema legado de CRM e fica isolado em `apps/dashboard`, `apps/api-gateway`, `apps/agent-orchestrator` e `packages/db` até a migração dirigida.
- docs/adrs/ADR-031-monorepo-source-of-truth.md:32:1. Migrar um domínio legado por vez de `@birthub/db` para `@birthub/database`.
- docs/adrs/ADR-033-billing-canonical-schema-cutover.md:11:2. Legacy CRM runtime on `@birthub/db` (schema drift and incompatible domain models).
- docs/adrs/ADR-033-billing-canonical-schema-cutover.md:21:3. `@birthub/db` is frozen legacy compatibility and cannot be imported by `apps/api-gateway` or `apps/agent-orchestrator`.
- docs/adrs/ADR-033-billing-canonical-schema-cutover.md:29:- Removes active `@birthub/db` usage from supported gateway/orchestrator surfaces.
- docs/architecture/internal-package-graph.md:22:  dbCompat["@birthub/db (legacy)"] --> database
- docs/architecture/internal-package-graph.md:28:- `@birthub/db` permanece como camada de compatibilidade legada e não pode ganhar novos consumidores runtime fora da exceção documentada.
- docs/evidence/2026-03-24-core-hardening-execution.md:106:  - objetivo: bloquear regressão de referências a `@birthub/db`/`packages/db` fora de `packages/db` e eixos documentais.
- docs/evidence/db-package-fix.md:3:O monorepo BirthHub estava apresentando falhas de importação nos testes de integração do `api-gateway` e em outros locais com a mensagem `"The requested module '@birthub/db' does not provide an export named 'prisma'"`. A causa raiz era que o pacote `@birthub/db` não tinha uma estrutura válida de ESM/NodeNext, nem compilação de fato para que os importadores pudessem consumir adequadamente a exportação nominal do Prisma.
- docs/evidence/db-package-fix.md:23:        "name": "@birthub/db",
- docs/evidence/db-package-fix.md:64:O Node conseguiu resolver o pacote `@birthub/db` pelo seu entrypoint público (`@birthub/db` que redireciona para `./dist/index.js`). Os testes do `api-gateway` deixaram de lançar erros de sintaxe ou módulo não encontrado, terminando em 73 passes no total (`pnpm test --filter=@birthub/api-gateway`).
- docs/execution/f2-legacy-quarantine-2026-03-20.md:8:- **Objetivo:** remover o ultimo consumidor runtime de `@birthub/db` fora do pacote de compatibilidade e formalizar o status das superficies legadas.
- docs/execution/f2-legacy-quarantine-2026-03-20.md:14:- `apps/dashboard/package.json` deixa de depender de `@birthub/db` e passa a consumir `@birthub/database`.
- docs/execution/f2-legacy-quarantine-2026-03-20.md:20:- `scripts/ci/workspace-contract.json` passa a permitir `@birthub/db` apenas no pacote de compatibilidade `packages/db`.
- docs/execution/f2-legacy-quarantine-2026-03-20.md:35:1. **Marco 1:** nenhum app em `apps/*` consome `@birthub/db` em runtime.
- docs/execution/f2-legacy-quarantine-2026-03-20.md:37:3. **Marco 3:** remover o pacote quando `git grep "@birthub/db" -- apps packages agents` retornar apenas documentacao historica aprovada.
- docs/execution/f2-legacy-quarantine-2026-03-20.md:41:- Reverter o dashboard para `@birthub/db` apenas em incidente de compatibilidade comprovado entre schemas.
- docs/execution/f2-legacy-quarantine-2026-03-21.md:15:- `git grep "@birthub/db" -- apps packages agents`
- docs/execution/f2-legacy-quarantine-2026-03-21.md:40:1. **Marco M1 (atingido):** nenhum app em `apps/*` consome `@birthub/db` em runtime.
- docs/execution/runtime-legacy-cutover-2026-03-24.md:15:git grep -n -I -E "apps/api-gateway|apps/agent-orchestrator|packages/db|@birthub/db" -- .
- docs/f10/dependency-graph.md:45:    _birthub_db["@birthub/db"]
- docs/migration/legacy-api-gateway-strangler.md:21:- Move consumers from `@birthub/db` to `@birthub/database`.
- docs/processes/MIGRACAO_CANONICA_DB.md:5:- Origem: `@birthub/db` (legado).
- docs/processes/MIGRACAO_CANONICA_DB.md:8:## Inventário atual de consumidores de `@birthub/db` (2026-03-24)
- docs/processes/MIGRACAO_CANONICA_DB.md:13:git grep -n -I -E "packages/db|@birthub/db" -- .
- docs/processes/MIGRACAO_CANONICA_DB.md:35:- `git grep "@birthub/db" -- apps packages agents`
- docs/processes/MIGRACAO_CANONICA_DB.md:42:1. Proibir novos imports `@birthub/db` (doctor/CI).
- docs/processes/MIGRACAO_CANONICA_DB.md:43:2. Manter `@birthub/db` restrito ao pacote de compatibilidade `packages/db`.
- docs/release/f11-executive-summary-2026-03-22.md:22:- Legacy `@birthub/db` usage is quarantined to the deprecated package itself and its README in the current grep scope.

## Metadata de pacote

- docs/programs/12-ciclos/F2.html:701:                    <div class="task-text">Auditar apps/dashboard/package.json: remover @birthub/db ou registrar exceção formal</div>
