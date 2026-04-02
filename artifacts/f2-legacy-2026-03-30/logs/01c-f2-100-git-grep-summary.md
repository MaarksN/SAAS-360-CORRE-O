# F2-100 — Varredura `@birthub/db`

Data (UTC): 2026-03-30
Comando: git grep -n '@birthub/db' -- .
Total de ocorrências: 24
Ocorrências em runtime/código: 5
Ocorrências em documentação: 19
Ocorrências em metadata de pacote: 0

## Runtime/Código

- scripts/ci/check-legacy-db-surface-freeze.mjs:64:  console.error("Only docs/artifacts/diagnostics and packages/db compatibility layer may reference '@birthub/db' or 'packages/db'.");
- scripts/ci/monorepo-doctor.mjs:115:const legacyImportRule = workspaceContract.importRules.find((rule) => rule.packageName === '@birthub/db');
- scripts/ci/monorepo-doctor.mjs:118:  return c.includes('@birthub/db')?[f]:[];
- scripts/diagnostics/audit-legacy-db-imports.mjs:67:const grepOutput = runGit("git grep -n '@birthub/db' -- .");
- scripts/diagnostics/audit-legacy-db-imports.mjs:80:  `Comando: git grep -n '@birthub/db' -- .`,

## Documentação

- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:4:Comando: git grep -n '@birthub/db' -- .
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:14:- docs/programs/12-ciclos/F2.html:725:                    <div class="task-text">Executar git grep '@birthub/db' em todo o repositório e registrar achados</div>
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:16:- docs/programs/12-ciclos/F2.html:757:                    <div class="task-text">Executar verificação final: git grep '@birthub/db' deve retornar zero resultados</div>
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:29:- scripts/ci/check-legacy-db-surface-freeze.mjs:64:  console.error("Only docs/artifacts/diagnostics and packages/db compatibility layer may reference '@birthub/db' or 'packages/db'.");
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:30:- scripts/ci/monorepo-doctor.mjs:115:const legacyImportRule = workspaceContract.importRules.find((rule) => rule.packageName === '@birthub/db');
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:31:- scripts/ci/monorepo-doctor.mjs:118:  return c.includes('@birthub/db')?[f]:[];
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:36:- scripts/diagnostics/audit-legacy-db-imports.mjs:67:const grepOutput = runGit("git grep -n '@birthub/db' -- .");
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:38:- scripts/diagnostics/audit-legacy-db-imports.mjs:80:  `Comando: git grep -n '@birthub/db' -- .`,
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:45:- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:4:Comando: git grep -n '@birthub/db' -- .
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:48:- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:14:- docs/programs/12-ciclos/F2.html:725:                    <div class="task-text">Executar git grep '@birthub/db' em todo o repositório e registrar achados</div>
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:50:- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:16:- docs/programs/12-ciclos/F2.html:757:                    <div class="task-text">Executar verificação final: git grep '@birthub/db' deve retornar zero resultados</div>
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:63:- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:29:- scripts/ci/check-legacy-db-surface-freeze.mjs:64:  console.error("Only docs/artifacts/diagnostics and packages/db compatibility layer may reference '@birthub/db' or 'packages/db'.");
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:64:- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:30:- scripts/ci/monorepo-doctor.mjs:115:const legacyImportRule = workspaceContract.importRules.find((rule) => rule.packageName === '@birthub/db');
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:65:- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:31:- scripts/ci/monorepo-doctor.mjs:118:  return c.includes('@birthub/db')?[f]:[];
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:70:- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:36:- scripts/diagnostics/audit-legacy-db-imports.mjs:67:const grepOutput = runGit("git grep -n '@birthub/db' -- .");
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:72:- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:38:- scripts/diagnostics/audit-legacy-db-imports.mjs:80:  `Comando: git grep -n '@birthub/db' -- .`,
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:86:- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:55:- docs/evidence/db-package-fix.md:3:O monorepo BirthHub estava apresentando falhas de importação nos testes de integração do `api-gateway` e em outros locais com a mensagem `"The requested module '@birthub/db' does not provide an export named 'prisma'"`. A causa raiz era que o pacote `@birthub/db` não tinha uma estrutura válida de ESM/NodeNext, nem compilação de fato para que os importadores pudessem consumir adequadamente a exportação nominal do Prisma.
- artifacts/f2-legacy-2026-03-25/logs/01c-f2-100-git-grep-summary.md:119:- docs/evidence/db-package-fix.md:3:O monorepo BirthHub estava apresentando falhas de importação nos testes de integração do `api-gateway` e em outros locais com a mensagem `"The requested module '@birthub/db' does not provide an export named 'prisma'"`. A causa raiz era que o pacote `@birthub/db` não tinha uma estrutura válida de ESM/NodeNext, nem compilação de fato para que os importadores pudessem consumir adequadamente a exportação nominal do Prisma.
- docs/evidence/db-package-fix.md:3:O monorepo BirthHub estava apresentando falhas de importação nos testes de integração do `api-gateway` e em outros locais com a mensagem `"The requested module '@birthub/db' does not provide an export named 'prisma'"`. A causa raiz era que o pacote `@birthub/db` não tinha uma estrutura válida de ESM/NodeNext, nem compilação de fato para que os importadores pudessem consumir adequadamente a exportação nominal do Prisma.

## Metadata de pacote

Nenhum resultado.
